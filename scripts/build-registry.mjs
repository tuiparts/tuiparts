import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const outputFlag = args.findIndex((argument) => argument === "--output");
const inlineOutput = args.find((argument) => argument.startsWith("--output="));
const requestedOutput =
  inlineOutput?.slice("--output=".length) ??
  (outputFlag === -1 ? undefined : args[outputFlag + 1]);

if (outputFlag !== -1 && !requestedOutput) {
  console.error("--output requires a directory");
  process.exitCode = 1;
} else {
  const output = resolve(root, requestedOutput ?? "public/r");
  const registry = JSON.parse(
    readFileSync(join(root, "registry.json"), "utf8"),
  );
  for (const item of registry.items) {
    mkdirSync(dirname(join(output, `${item.name}.json`)), { recursive: true });
  }

  const buildArgs = ["build", "registry.json", ...args];
  if (!requestedOutput) buildArgs.push("--output", output);
  const executable = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "shadcn.cmd" : "shadcn",
  );
  const result = spawnSync(executable, buildArgs, {
    cwd: root,
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
}
