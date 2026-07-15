import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = [
  ["core", "@tuiparts/core"],
  ["react", "@tuiparts/react"],
  ["solid", "@tuiparts/solid"],
  ["dialog", "@tuiparts/dialog"],
  ["toast", "@tuiparts/toast"],
];
const workDir = mkdtempSync(join(tmpdir(), "tuiparts-packages-"));
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
    name: "tuiparts-packed-consumer",
    private: true,
    type: "module",
    packageManager: "pnpm@10.34.5",
    pnpm: {
      supportedArchitectures: {
        libc: ["current", "musl"],
      },
    },
    dependencies: {
      ...Object.fromEntries(tarballs),
      "@opentui/core": "0.4.3",
      "@opentui/react": "0.4.3",
      "@opentui/solid": "0.4.3",
      react: "19.2.7",
      "solid-js": "1.9.12",
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
    `packages:\n  - "."\n\noverrides:\n  "@tuiparts/core": "${tarballs.get("@tuiparts/core")}"\n`,
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
    "@tuiparts/core",
    "@tuiparts/core/button",
    "@tuiparts/core/checkbox",
    "@tuiparts/core/dialog",
    "@tuiparts/core/input",
    "@tuiparts/core/radio",
    "@tuiparts/core/radio-group",
    "@tuiparts/core/switch",
    "@tuiparts/react",
    "@tuiparts/react/button",
    "@tuiparts/react/checkbox",
    "@tuiparts/react/dialog",
    "@tuiparts/react/input",
    "@tuiparts/react/radio",
    "@tuiparts/react/radio-group",
    "@tuiparts/react/switch",
    "@tuiparts/solid",
    "@tuiparts/solid/button",
    "@tuiparts/solid/checkbox",
    "@tuiparts/solid/dialog",
    "@tuiparts/solid/input",
    "@tuiparts/solid/radio",
    "@tuiparts/solid/radio-group",
    "@tuiparts/solid/switch",
    "@tuiparts/dialog",
    "@tuiparts/dialog/themes",
    "@tuiparts/dialog/react",
    "@tuiparts/dialog/solid",
    "@tuiparts/toast",
    "@tuiparts/toast/themes",
    "@tuiparts/toast/icons",
    "@tuiparts/toast/react",
    "@tuiparts/toast/solid",
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
  writeFileSync(
    join(consumerDir, "executable.ts"),
    `import { createTestRenderer } from "@opentui/core/testing";
import { CheckboxRootRenderable } from "@tuiparts/core/checkbox";

const setup = await createTestRenderer({ width: 20, height: 3 });
try {
  const checkbox = new CheckboxRootRenderable(setup.renderer);
  setup.renderer.root.add(checkbox);
  checkbox.press();
  if (!checkbox.checked) throw new Error("Compiled Checkbox did not activate");
} finally {
  setup.renderer.destroy();
}
`,
  );

  run(
    "pnpm",
    ["install", "--frozen-lockfile=false", "--strict-peer-dependencies"],
    consumerDir,
  );
  run("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], consumerDir);
  run("bun", ["runtime.mjs"], consumerDir);
  run(
    "bun",
    ["build", "--compile", "executable.ts", "--outfile", "executable"],
    consumerDir,
  );
  run(join(consumerDir, "executable"), [], consumerDir);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
