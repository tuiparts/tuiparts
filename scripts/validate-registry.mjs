import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workDir = mkdtempSync(join(tmpdir(), "opentui-ui-registry-"));
const registryDir = join(workDir, "registry");
const consumerDir = join(workDir, "core-consumer");
const coreTarball = join(workDir, "core.tgz");

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

try {
  for (const framework of ["core", "react", "solid"]) {
    mkdirSync(join(registryDir, framework), { recursive: true });
  }
  mkdirSync(consumerDir);

  run("pnpm", ["--filter", "@opentui-ui/core", "build"]);
  run("pnpm", ["--dir", "packages/core", "pack", "--out", coreTarball]);
  run("pnpm", [
    "dlx",
    "shadcn@4.13.0",
    "build",
    "registry.json",
    "--output",
    registryDir,
  ]);

  writeFileSync(
    join(consumerDir, "package.json"),
    `${JSON.stringify(
      {
        name: "opentui-ui-registry-core-consumer",
        private: true,
        type: "module",
        packageManager: "pnpm@10.34.5",
        devDependencies: {
          "@types/node": "24.13.3",
          typescript: "5.9.3",
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(consumerDir, "pnpm-workspace.yaml"),
    `packages:\n  - "."\n`,
  );
  writeFileSync(
    join(consumerDir, "tsconfig.json"),
    `${JSON.stringify(
      {
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
          types: ["node"],
        },
        include: ["components/**/*.ts"],
      },
      null,
      2,
    )}\n`,
  );

  const untouched = "registry installation must not modify this file\n";
  writeFileSync(join(consumerDir, "untouched.txt"), untouched);

  run("pnpm", [
    "dlx",
    "shadcn@4.13.0",
    "add",
    join(registryDir, "core/checkbox.json"),
    "--cwd",
    consumerDir,
    "--yes",
  ]);

  const installedRecipe = readFileSync(
    join(consumerDir, "components/ui/checkbox.ts"),
    "utf8",
  );
  const sourceRecipe = readFileSync(
    join(root, "registry/checkbox/core.ts"),
    "utf8",
  );

  if (installedRecipe !== sourceRecipe) {
    throw new Error("Installed Core recipe differs from its registry source");
  }
  if (readFileSync(join(consumerDir, "untouched.txt"), "utf8") !== untouched) {
    throw new Error("Registry installation modified an unrelated file");
  }

  const installedPackage = JSON.parse(
    readFileSync(join(consumerDir, "package.json"), "utf8"),
  );
  if (
    installedPackage.dependencies?.["@opentui-ui/core"] !== "^0.0.2" ||
    installedPackage.dependencies?.["@opentui/core"] !== "^0.4.3"
  ) {
    throw new Error("Core registry dependencies were not installed as declared");
  }

  run(
    "pnpm",
    ["add", `@opentui-ui/core@file:${coreTarball}`],
    consumerDir,
  );
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], consumerDir);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
