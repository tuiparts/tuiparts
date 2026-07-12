import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { subset } from "semver";

const root = resolve(import.meta.dirname, "..");
const workDir = mkdtempSync(join(tmpdir(), "opentui-ui-registry-"));
const registryDir = join(workDir, "registry");
const tarballDir = join(workDir, "tarballs");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const packageDirectories = {
  "@opentui-ui/core": "core",
  "@opentui-ui/react": "react",
  "@opentui-ui/solid": "solid",
  "@opentui-ui/styles": "styles",
};
const consumers = [
  {
    framework: "core",
    source: "registry/checkbox/core.ts",
    target: "components/ui/checkbox.ts",
    localPackages: ["@opentui-ui/core"],
    smoke: "registry/checkbox/smoke/core.test.ts",
    smokeFile: "smoke.test.ts",
  },
  {
    framework: "react",
    source: "registry/checkbox/react.tsx",
    target: "components/ui/checkbox.tsx",
    localPackages: [
      "@opentui-ui/core",
      "@opentui-ui/styles",
      "@opentui-ui/react",
    ],
    devDependencies: {
      "@types/react": "19.2.17",
    },
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "@opentui/react",
    },
    smoke: "registry/checkbox/smoke/react.test.tsx",
    smokeBuild: true,
    smokeFile: "smoke.test.tsx",
  },
  {
    framework: "solid",
    source: "registry/checkbox/solid.tsx",
    target: "components/ui/checkbox.tsx",
    localPackages: [
      "@opentui-ui/core",
      "@opentui-ui/styles",
      "@opentui-ui/solid",
    ],
    compilerOptions: {
      jsx: "preserve",
      jsxImportSource: "@opentui/solid",
    },
    smoke: "registry/checkbox/smoke/solid.test.tsx",
    smokeFile: "smoke.test.tsx",
    smokePreload: "@opentui/solid/preload",
  },
];

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function packageName(specifier) {
  const separator = specifier.lastIndexOf("@");
  return separator > 0 ? specifier.slice(0, separator) : specifier;
}

function packageRange(specifier) {
  const separator = specifier.lastIndexOf("@");
  return separator > 0 ? specifier.slice(separator + 1) : "*";
}

function snapshotFiles(directory, current = directory, files = new Map()) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      snapshotFiles(directory, path, files);
    } else if (statSync(path).isFile()) {
      files.set(relative(directory, path), readFileSync(path, "utf8"));
    }
  }
  return files;
}

try {
  for (const framework of ["core", "react", "solid"]) {
    mkdirSync(join(registryDir, framework), { recursive: true });
  }
  mkdirSync(tarballDir);

  const packageNames = Object.keys(packageDirectories);
  run("pnpm", packageNames.flatMap((name) => ["--filter", name]).concat("build"));

  const tarballs = new Map();
  const packageVersions = new Map();
  for (const [packageName, directory] of Object.entries(packageDirectories)) {
    const tarball = join(tarballDir, `${directory}.tgz`);
    run("pnpm", ["--dir", `packages/${directory}`, "pack", "--out", tarball]);
    tarballs.set(packageName, tarball);
    packageVersions.set(
      packageName,
      JSON.parse(
        readFileSync(join(root, `packages/${directory}/package.json`), "utf8"),
      ).version,
    );
  }

  run("pnpm", [
    "dlx",
    "shadcn@4.13.0",
    "build",
    "registry.json",
    "--output",
    registryDir,
  ]);

  for (const consumer of consumers) {
    const consumerDir = join(workDir, `${consumer.framework}-consumer`);
    const registryItem = registry.items.find(
      (item) => item.name === `${consumer.framework}/checkbox`,
    );
    assert(registryItem, `Missing ${consumer.framework} registry item`);
    const builtItem = JSON.parse(
      readFileSync(
        join(registryDir, `${consumer.framework}/checkbox.json`),
        "utf8",
      ),
    );
    assert(
      JSON.stringify(builtItem.dependencies) ===
        JSON.stringify(registryItem.dependencies),
      `${consumer.framework} build changed registry dependencies`,
    );
    const dependencyNames = registryItem.dependencies.map(packageName);

    mkdirSync(consumerDir);
    writeJson(join(consumerDir, "package.json"), {
      name: `opentui-ui-registry-${consumer.framework}-consumer`,
      private: true,
      type: "module",
      packageManager: "pnpm@10.34.5",
      devDependencies: {
        "@types/bun": "1.3.14",
        "@types/node": "24.13.3",
        typescript: "5.9.3",
        ...consumer.devDependencies,
      },
    });
    writeFileSync(
      join(consumerDir, "pnpm-workspace.yaml"),
      `packages:\n  - "."\n`,
    );
    writeJson(join(consumerDir, "tsconfig.json"), {
      compilerOptions: {
        lib: ["ESNext"],
        target: "ESNext",
        module: "Preserve",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        types: ["bun", "node"],
        ...consumer.compilerOptions,
      },
      include: [consumer.target, ...(consumer.smoke ? [consumer.smokeFile] : [])],
    });

    const untouched = "registry installation must not modify this file\n";
    writeFileSync(join(consumerDir, "untouched.txt"), untouched);
    const beforeInstall = snapshotFiles(consumerDir);

    run("pnpm", [
      "dlx",
      "shadcn@4.13.0",
      "add",
      join(registryDir, `${consumer.framework}/checkbox.json`),
      "--cwd",
      consumerDir,
      "--yes",
    ]);

    assert(
      readFileSync(join(consumerDir, consumer.target), "utf8") ===
        readFileSync(join(root, consumer.source), "utf8"),
      `Installed ${consumer.framework} recipe differs from its registry source`,
    );
    const afterInstall = snapshotFiles(consumerDir);
    const allowedChanges = new Set([
      "package.json",
      "pnpm-lock.yaml",
      consumer.target,
    ]);
    for (const [path, content] of afterInstall) {
      if (allowedChanges.has(path)) continue;
      assert(
        beforeInstall.get(path) === content,
        `${consumer.framework} registry installation changed ${path}`,
      );
    }
    for (const path of beforeInstall.keys()) {
      assert(
        allowedChanges.has(path) || afterInstall.has(path),
        `${consumer.framework} registry installation removed ${path}`,
      );
    }

    const installedPackage = JSON.parse(
      readFileSync(join(consumerDir, "package.json"), "utf8"),
    );
    assert(
      JSON.stringify(Object.keys(installedPackage.dependencies).sort()) ===
        JSON.stringify([...dependencyNames].sort()),
      `${consumer.framework} registry dependencies do not match the item`,
    );
    for (const dependency of registryItem.dependencies) {
      const name = packageName(dependency);
      assert(
        subset(installedPackage.dependencies[name], packageRange(dependency)),
        `${consumer.framework} installed ${name} outside its declared range`,
      );
    }

    const publishedPackages = consumer.localPackages.filter(
      (name) => installedPackage.dependencies?.[name] !== undefined,
    );
    writeFileSync(
      join(consumerDir, "pnpm-workspace.yaml"),
      `packages:\n  - "."\n\noverrides:\n${Object.keys(packageDirectories)
        .map((name) => `  "${name}": "file:${tarballs.get(name)}"`)
        .join("\n")}\n`,
    );
    run("pnpm", ["remove", ...publishedPackages], consumerDir);
    run(
      "pnpm",
      [
        "add",
        ...publishedPackages.map(
          (name) => `${name}@file:${tarballs.get(name)}`,
        ),
      ],
      consumerDir,
    );
    run("pnpm", ["install", "--strict-peer-dependencies"], consumerDir);

    const localLockfile = readFileSync(
      join(consumerDir, "pnpm-lock.yaml"),
      "utf8",
    );
    for (const name of consumer.localPackages) {
      assert(
        localLockfile.includes(`file:${tarballs.get(name)}`),
        `${consumer.framework} lockfile did not resolve ${name} locally`,
      );
      assert(
        !localLockfile.includes(`${name}@${packageVersions.get(name)}`),
        `${consumer.framework} lockfile retained published ${name}`,
      );
    }

    if (consumer.smoke) {
      writeFileSync(
        join(consumerDir, consumer.smokeFile),
        readFileSync(join(root, consumer.smoke), "utf8"),
      );
    }
    run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], consumerDir);
    if (consumer.smoke) {
      let smokeFile = consumer.smokeFile;
      if (consumer.smokeBuild) {
        run(
          "bun",
          [
            "build",
            smokeFile,
            "--outdir",
            "compiled",
            "--target",
            "bun",
            "--packages",
            "external",
          ],
          consumerDir,
        );
        smokeFile = `compiled/${smokeFile.replace(/\.tsx?$/, ".js")}`;
      }
      run(
        "bun",
        [
          "test",
          ...(consumer.smokePreload
            ? ["--preload", consumer.smokePreload]
            : []),
          smokeFile,
        ],
        consumerDir,
      );
    }
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
