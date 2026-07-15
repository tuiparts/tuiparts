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
const workDir = mkdtempSync(join(tmpdir(), "opentui-ui-release-"));
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
  const preState = JSON.parse(
    readFileSync(join(root, ".changeset/pre.json"), "utf8"),
  );
  let plan;
  if (versionedRelease) {
    const changesetIds = readdirSync(join(root, ".changeset"))
      .filter((file) => file.endsWith(".md") && file !== "README.md")
      .map((file) => file.slice(0, -3));
    assert(
      changesetIds.length > 0 &&
        changesetIds.every((id) => preState.changesets.includes(id)),
      "The version PR must record every release changeset as consumed",
    );
    plan = { releases: [], preState };
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
    if (versionedRelease) {
      const packagePath = packageName.split("/").at(-1);
      const version = JSON.parse(
        readFileSync(join(root, `packages/${packagePath}/package.json`), "utf8"),
      ).version;
      assert(
        version === preState.initialVersions[packageName],
        `${packageName} must remain at its pre-RC version`,
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
  assert(
    plan.preState?.mode === "pre" && plan.preState?.tag === "rc",
    "Changesets must remain in RC prerelease mode",
  );
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
