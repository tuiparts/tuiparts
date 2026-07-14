import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workDir = mkdtempSync(join(tmpdir(), "opentui-ui-release-"));
const output = join(workDir, "changeset-status.json");
const foundationPackages = [
  "@opentui-ui/core",
  "@opentui-ui/react",
  "@opentui-ui/solid",
];
const companionPackages = ["@opentui-ui/dialog", "@opentui-ui/toast"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  execFileSync(
    "pnpm",
    ["exec", "changeset", "status", "--output", output],
    { cwd: root, stdio: "inherit" },
  );
  const plan = JSON.parse(readFileSync(output, "utf8"));
  const releases = new Map(
    plan.releases.map((release) => [release.name, release]),
  );

  const plannedFoundation = foundationPackages.filter((packageName) =>
    releases.has(packageName),
  );
  assert(
    plannedFoundation.length === 0 ||
      plannedFoundation.length === foundationPackages.length,
    "Linked foundation packages must enter the release plan together",
  );
  const foundationVersions = new Set();
  for (const packageName of foundationPackages) {
    const release = releases.get(packageName);
    const version = release
      ? release.newVersion
      : JSON.parse(
          readFileSync(
            join(root, `packages/${packageName.split("/").at(-1)}/package.json`),
            "utf8",
          ),
        ).version;
    assert(
      version.includes("-rc."),
      `${packageName} must release on the RC prerelease tag`,
    );
    foundationVersions.add(version);
  }
  assert(
    foundationVersions.size === 1,
    "Linked foundation packages must release at the same version",
  );

  for (const packageName of companionPackages) {
    assert(
      !releases.has(packageName),
      `${packageName} is a deferred companion and must not join the foundation RC`,
    );
  }
  assert(
    !releases.has("@opentui-ui/styles"),
    "The removed styles package must not appear in the release plan",
  );
  assert(
    plan.preState?.mode === "pre" && plan.preState?.tag === "rc",
    "Changesets must remain in RC prerelease mode",
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
