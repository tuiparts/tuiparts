import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = [
  ["core", "@opentui-ui/core"],
  ["react", "@opentui-ui/react"],
  ["solid", "@opentui-ui/solid"],
  ["dialog", "@opentui-ui/dialog"],
  ["toast", "@opentui-ui/toast"],
];
const workDir = mkdtempSync(join(tmpdir(), "opentui-ui-packages-"));
const tarballDir = join(workDir, "tarballs");
const consumerDir = join(workDir, "consumer");

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

try {
  const tarballs = new Map();

  for (const [directory, packageName] of packages) {
    const tarball = join(tarballDir, `${directory}.tgz`);
    run("pnpm", ["--dir", `packages/${directory}`, "pack", "--out", tarball]);
    run("pnpm", ["exec", "publint", tarball, "--strict"]);
    run("pnpm", [
      "exec",
      "attw",
      tarball,
      "--profile",
      "esm-only",
      "--no-emoji",
    ]);
    tarballs.set(packageName, `file:${tarball}`);
  }

  const packageJson = {
    name: "opentui-ui-packed-consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@10.34.5",
    dependencies: {
      ...Object.fromEntries(tarballs),
      "@opentui/core": "0.4.3",
      "@opentui/react": "0.4.3",
      "@opentui/solid": "0.4.3",
      react: "19.2.7",
      "solid-js": "1.9.12",
      ws: "8.21.0",
    },
    devDependencies: {
      "@types/node": "24.13.3",
      "@types/react": "19.2.17",
      typescript: "5.9.3",
    },
  };

  mkdirSync(consumerDir);
  writeFileSync(
    join(consumerDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  writeFileSync(
    join(consumerDir, "pnpm-workspace.yaml"),
    `packages:\n  - "."\n\noverrides:\n  "@opentui-ui/core": "${tarballs.get("@opentui-ui/core")}"\n`,
  );
  writeFileSync(
    join(consumerDir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ["ESNext"],
          target: "ESNext",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: ["node"],
        },
        include: ["consumer.ts"],
      },
      null,
      2,
    )}\n`,
  );

  const entrypoints = [
    "@opentui-ui/core",
    "@opentui-ui/core/button",
    "@opentui-ui/core/checkbox",
    "@opentui-ui/core/input",
    "@opentui-ui/core/radio",
    "@opentui-ui/core/radio-group",
    "@opentui-ui/core/switch",
    "@opentui-ui/react",
    "@opentui-ui/react/button",
    "@opentui-ui/react/checkbox",
    "@opentui-ui/react/input",
    "@opentui-ui/react/radio",
    "@opentui-ui/react/radio-group",
    "@opentui-ui/react/switch",
    "@opentui-ui/solid",
    "@opentui-ui/solid/button",
    "@opentui-ui/solid/checkbox",
    "@opentui-ui/solid/input",
    "@opentui-ui/solid/radio",
    "@opentui-ui/solid/radio-group",
    "@opentui-ui/solid/switch",
    "@opentui-ui/dialog",
    "@opentui-ui/dialog/themes",
    "@opentui-ui/dialog/react",
    "@opentui-ui/dialog/solid",
    "@opentui-ui/toast",
    "@opentui-ui/toast/themes",
    "@opentui-ui/toast/icons",
    "@opentui-ui/toast/react",
    "@opentui-ui/toast/solid",
  ];
  const imports = entrypoints
    .map((entrypoint) => `import * as module${entrypoints.indexOf(entrypoint)} from "${entrypoint}";`)
    .join("\n");
  const references = entrypoints
    .map((_, index) => `module${index}`)
    .join(", ");
  writeFileSync(
    join(consumerDir, "consumer.ts"),
    `${imports}\n\nvoid [${references}];\n`,
  );
  writeFileSync(
    join(consumerDir, "runtime.mjs"),
    `await Promise.all(${JSON.stringify(entrypoints)}.map((entrypoint) => import(entrypoint)));\n`,
  );

  run(
    "pnpm",
    ["install", "--frozen-lockfile=false", "--strict-peer-dependencies"],
    consumerDir,
  );
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], consumerDir);
  run("bun", ["runtime.mjs"], consumerDir);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
