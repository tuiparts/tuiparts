import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workDir = mkdtempSync(join(tmpdir(), "tuiparts-release-"));
const output = join(workDir, "changeset-status.json");
const foundationPackages = [
  "@tuiparts/core",
  "@tuiparts/react",
  "@tuiparts/solid",
];
const companionPackages = ["@tuiparts/dialog", "@tuiparts/toast"];
const versionedRelease = process.argv.includes("--versioned");
const since = process.argv.find((argument) => argument.startsWith("--since="));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  assert(
    !existsSync(join(root, ".changeset/pre.json")),
    "Foundation releases must not use Changesets prerelease mode",
  );
  let plan;
  if (versionedRelease) {
    const changesetIds = readdirSync(join(root, ".changeset"))
      .filter((file) => file.endsWith(".md") && file !== "README.md")
      .map((file) => file.slice(0, -3));
    assert(
      changesetIds.length === 0,
      "The version PR must consume every release changeset",
    );
    plan = { releases: [] };
  } else {
    const statusArguments = [
      "exec",
      "changeset",
      "status",
      "--output",
      output,
    ];
    if (since) statusArguments.push(since);
    execFileSync(
      "pnpm",
      statusArguments,
      { cwd: root, stdio: "inherit" },
    );
    plan = JSON.parse(readFileSync(output, "utf8"));
  }
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
      /^\d+\.\d+\.\d+$/.test(version),
      `${packageName} must use a stable semantic version`,
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
      `${packageName} is an independent companion and must not join a foundation release`,
    );
    if (versionedRelease) {
      const packagePath = packageName.split("/").at(-1);
      const version = JSON.parse(
        readFileSync(join(root, `packages/${packagePath}/package.json`), "utf8"),
      ).version;
      const baseVersion = JSON.parse(
        execFileSync(
          "git",
          ["show", `origin/main:packages/${packagePath}/package.json`],
          { cwd: root, encoding: "utf8" },
        ),
      ).version;
      assert(
        version === baseVersion,
        `${packageName} must remain unchanged in the foundation version PR`,
      );
    }
  }
  assert(
    !releases.has("@tuiparts/styles"),
    "The removed styles package must not appear in the release plan",
  );
  assert(
    !existsSync(join(root, "packages/styles/package.json")),
    "The removed styles package must not be restored",
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
