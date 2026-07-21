import { spawn } from "node:child_process";
import {
  existsSync,
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
import { inc, satisfies } from "semver";

const root = resolve(import.meta.dirname, "..");
const workDir = mkdtempSync(join(tmpdir(), "tuiparts-registry-"));
const registryDir = join(workDir, "registry");
const tarballDir = join(workDir, "tarballs");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const packageDirectories = {
  "@tuiparts/core": "core",
  "@tuiparts/react": "react",
  "@tuiparts/solid": "solid",
};
const nextFoundationVersion = inc(
  JSON.parse(
    readFileSync(join(root, "packages/core/package.json"), "utf8"),
  ).version,
  "patch",
);
assert(nextFoundationVersion, "Core package version cannot be incremented");
const frameworks = {
  core: {
    extension: "ts",
    hostDependencies: {
      "@opentui/core": "^0.4.3",
    },
    localPackages: ["@tuiparts/core"],
    smokeFile: "smoke.test.ts",
  },
  react: {
    extension: "tsx",
    hostDependencies: {
      "@opentui/core": "^0.4.3",
      "@opentui/react": "^0.4.3",
      react: "^19.2.0",
    },
    hostDevDependencies: {
      "@types/react": "^19.2.0",
    },
    localPackages: ["@tuiparts/core", "@tuiparts/react"],
    compilerOptions: {
      jsx: "react-jsx",
      jsxImportSource: "@opentui/react",
    },
    smokeBuild: true,
    smokeFile: "smoke.test.tsx",
  },
  solid: {
    extension: "tsx",
    hostDependencies: {
      "@opentui/core": "^0.4.3",
      "@opentui/solid": "^0.4.3",
      "solid-js": "1.9.12",
    },
    localPackages: ["@tuiparts/core", "@tuiparts/solid"],
    compilerOptions: {
      jsx: "preserve",
      jsxImportSource: "@opentui/solid",
    },
    smokeFile: "smoke.test.tsx",
    smokePreload: "@opentui/solid/preload",
  },
};
const recipes = [
  "checkbox",
  "switch",
  "button",
  "badge",
  "radio-group",
  "input",
  "textarea",
  "dialog",
  "toggle",
  "toggle-group",
  "tabs",
  "theme",
];
const catalogRecipes = [
  "checkbox",
  "switch",
  "button",
  "badge",
  "radio-group",
  "input",
  "textarea",
  "dialog",
  "toggle",
  "toggle-group",
  "tabs",
  "theme",
];
const primitivelessRecipes = ["badge", "theme"];
const themePresets = [
  {
    item: "theme-cobalt-deep",
    source: "registry/theme/themes/cobalt-deep.ts",
    target: "themes/cobalt-deep.ts",
  },
  {
    item: "theme-ascii",
    source: "registry/theme/themes/ascii.ts",
    target: "themes/ascii.ts",
  },
  {
    item: "theme-catppuccin",
    source: "registry/theme/themes/catppuccin.ts",
    target: "themes/catppuccin.ts",
  },
  {
    item: "theme-gruvbox",
    source: "registry/theme/themes/gruvbox.ts",
    target: "themes/gruvbox.ts",
  },
  {
    item: "theme-rosepine",
    source: "registry/theme/themes/rosepine.ts",
    target: "themes/rosepine.ts",
  },
];
const expectedCatalogDependencyNames = {
  core: {
    primitive: ["@tuiparts/core"],
    recipe: [],
  },
  react: {
    primitive: ["@tuiparts/react"],
    recipe: [],
  },
  solid: {
    primitive: ["@tuiparts/solid"],
    recipe: [],
  },
};
function consumerFiles(recipe, framework, extension) {
  if (recipe !== "theme") {
    return [
      {
        source: `registry/${recipe}/${framework}.${extension}`,
        target: `components/ui/${recipe}.${extension}`,
      },
    ];
  }
  const themeSource = {
    source: "registry/theme/theme.ts",
    target: "components/ui/theme.ts",
  };
  if (framework === "core") return [themeSource];
  return [
    themeSource,
    {
      source: `registry/theme/${framework}.${extension}`,
      target: "components/ui/use-theme.tsx",
    },
  ];
}
const consumers = recipes.flatMap((recipe) =>
  Object.entries(frameworks).map(([framework, config]) => ({
    ...config,
    localPackages: config.localPackages,
    framework,
    recipe,
    files: consumerFiles(recipe, framework, config.extension),
    smoke: `registry/${recipe}/smoke/${framework}.test.${config.extension}`,
  })),
);
const built = process.argv.includes("--built");
const since = process.argv.find((argument) => argument.startsWith("--since="));
const recipeFilter = process.argv
  .find((argument) => argument.startsWith("--recipe="))
  ?.slice("--recipe=".length);
const frameworkFilter = process.argv
  .find((argument) => argument.startsWith("--framework="))
  ?.slice("--framework=".length);
const jobs = Number(
  process.argv
    .find((argument) => argument.startsWith("--jobs="))
    ?.slice("--jobs=".length) ?? 3,
);

function run(command, args, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}`,
        ),
      );
    });
  });
}

function capture(command, args, cwd = root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const output = `${stdout}${stderr}`;
      if (code === 0) {
        resolvePromise(output);
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}\n${output}`,
        ),
      );
    });
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeShadcnCompatibilityConfig(directory) {
  writeJson(join(directory, "components.json"), {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: {
      config: "",
      css: "",
      baseColor: "neutral",
      cssVariables: false,
      prefix: "",
    },
    iconLibrary: "lucide",
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
      utils: "@/lib/utils",
      ui: "@/components/ui",
    },
  });
}

/** Points an item's registry dependencies at the locally built registry. */
function localizeRegistryDependencies(item) {
  item.registryDependencies = item.registryDependencies?.map((address) =>
    address.replace("https://tuiparts.sh/r/", `${registryDir}/`),
  );
  return item;
}

function packageName(specifier) {
  const separator = specifier.lastIndexOf("@");
  return separator > 0 ? specifier.slice(0, separator) : specifier;
}

function packageRange(specifier) {
  const separator = specifier.lastIndexOf("@");
  return separator > 0 ? specifier.slice(separator + 1) : "*";
}

function localPackagesForConsumer(consumer, item) {
  const installsFoundationPackage = item.dependencies.some((dependency) =>
    packageName(dependency).startsWith("@tuiparts/"),
  );
  return installsFoundationPackage ? consumer.localPackages : [];
}

function sourceExports(source) {
  return [...source.matchAll(/^export (?:interface|type|function) (\w+)/gm)]
    .map((match) => match[1])
    .sort();
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

function validateOptions() {
  assert(!recipeFilter || recipes.includes(recipeFilter), `Unknown recipe ${recipeFilter}`);
  assert(
    !frameworkFilter || Object.hasOwn(frameworks, frameworkFilter),
    `Unknown framework ${frameworkFilter}`,
  );
  assert(Number.isInteger(jobs) && jobs > 0, "--jobs must be a positive integer");
}

function consumersAffectedBy(paths) {
  const selected = new Set();
  let exhaustive = false;

  for (const path of paths) {
    const recipeSource = path.match(
      /^registry\/([^/]+)\/(core|react|solid)\.(?:ts|tsx)$/,
    );
    const recipeSmoke = path.match(
      /^registry\/([^/]+)\/smoke\/(core|react|solid)\.test\.(?:ts|tsx)$/,
    );
    const recipeMatch = recipeSource ?? recipeSmoke;
    if (recipeMatch && recipes.includes(recipeMatch[1])) {
      selected.add(`${recipeMatch[2]}/${recipeMatch[1]}`);
      continue;
    }
    if (
      path.startsWith("registry/theme/") &&
      !path.startsWith("registry/theme/smoke/")
    ) {
      selected.add("core/theme");
      selected.add("react/theme");
      selected.add("solid/theme");
      continue;
    }
    if (path.startsWith("packages/core/")) {
      exhaustive = true;
      continue;
    }
    if (path.startsWith("packages/react/")) {
      for (const recipe of recipes) selected.add(`react/${recipe}`);
      continue;
    }
    if (path.startsWith("packages/solid/")) {
      for (const recipe of recipes) selected.add(`solid/${recipe}`);
      continue;
    }
    if (
      path === "registry.json" ||
      path === "package.json" ||
      path === "pnpm-lock.yaml" ||
      path === "pnpm-workspace.yaml" ||
      path === "scripts/validate-registry.mjs"
    ) {
      exhaustive = true;
    }
  }

  return exhaustive
    ? consumers
    : consumers.filter((consumer) =>
        selected.has(`${consumer.framework}/${consumer.recipe}`),
      );
}

async function runPool(items, concurrency, worker) {
  let next = 0;
  let failure;
  async function consume() {
    while (!failure && next < items.length) {
      const item = items[next];
      next += 1;
      try {
        await worker(item);
      } catch (error) {
        failure = error;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, consume),
  );
  if (failure) throw failure;
}

try {
  validateOptions();
  for (const consumer of consumers) {
    const itemName = `${consumer.framework}/${consumer.recipe}`;
    const item = registry.items.find((candidate) => candidate.name === itemName);
    assert(item, `Missing registry item ${itemName}`);
    assert(
      item.type === "registry:item",
      `${itemName} must be installable without components.json`,
    );
    assert(
      item.files.length === consumer.files.length &&
        consumer.files.every(
          (file, index) =>
            item.files[index]?.path === file.source &&
            item.files[index]?.target === file.target,
        ),
      `${itemName} must map its recipe source to the expected consumer target`,
    );
    for (const file of consumer.files) {
      assert(existsSync(join(root, file.source)), `Missing ${file.source}`);
    }
    assert(existsSync(join(root, consumer.smoke)), `Missing ${consumer.smoke}`);
  }
  for (const preset of themePresets) {
    const item = registry.items.find(
      (candidate) => candidate.name === preset.item,
    );
    assert(item, `Missing registry item ${preset.item}`);
    assert(
      item.type === "registry:item",
      `${preset.item} must be installable without components.json`,
    );
    assert(
      item.files.length === 1 &&
        item.files[0]?.path === preset.source &&
        item.files[0]?.target === preset.target,
      `${preset.item} must map its preset source to the expected consumer target`,
    );
    assert(existsSync(join(root, preset.source)), `Missing ${preset.source}`);
  }
  for (const item of registry.items) {
    assert(
      !item.devDependencies?.length,
      `${item.name} must inherit development tooling from its host application`,
    );
    for (const dependency of item.dependencies) {
      if (!Object.hasOwn(packageDirectories, packageName(dependency))) continue;
      assert(
        satisfies(nextFoundationVersion, packageRange(dependency)),
        `${item.name} does not accept foundation version ${nextFoundationVersion}`,
      );
    }
  }
  for (const recipe of catalogRecipes) {
    const reactSource = readFileSync(
      join(root, `registry/${recipe}/react.tsx`),
      "utf8",
    );
    const solidSource = readFileSync(
      join(root, `registry/${recipe}/solid.tsx`),
      "utf8",
    );
    assert(
      JSON.stringify(sourceExports(reactSource)) ===
        JSON.stringify(sourceExports(solidSource)),
      `${recipe} React and Solid recipes must share exported vocabulary`,
    );

    for (const framework of Object.keys(frameworks)) {
      const itemName = `${framework}/${recipe}`;
      const item = registry.items.find((candidate) => candidate.name === itemName);
      assert(item, `Missing catalog item ${itemName}`);
      assert(
        item.meta?.sourceOwnership === "consumer",
        `${itemName} must declare consumer-owned recipe source`,
      );
      assert(
        item.meta?.updateStrategy === "shadcn-diff",
        `${itemName} must declare the shadcn diff update strategy`,
      );
      const recipeKind = primitivelessRecipes.includes(recipe)
        ? "recipe"
        : "primitive";
      const actualDependencies = item.dependencies.map(packageName).sort();
      const expectedDependencies = expectedCatalogDependencyNames[framework][
        recipeKind
      ].toSorted();
      assert(
        JSON.stringify(actualDependencies) === JSON.stringify(expectedDependencies),
        `${itemName} dependencies do not match its ${recipeKind} boundary`,
      );
    }
  }

  for (const framework of Object.keys(frameworks)) {
    mkdirSync(join(registryDir, framework), { recursive: true });
  }
  mkdirSync(tarballDir);

  let selectedConsumers = consumers;
  if (since) {
    const changedFiles = (
      await capture("git", [
        "diff",
        "--name-only",
        `${since.slice("--since=".length)}...HEAD`,
      ])
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    selectedConsumers = consumersAffectedBy(changedFiles);
  }
  selectedConsumers = selectedConsumers.filter(
    (consumer) =>
      (!recipeFilter || consumer.recipe === recipeFilter) &&
      (!frameworkFilter || consumer.framework === frameworkFilter),
  );
  if (selectedConsumers.length === 0) {
    console.log("Registry structure is valid; no affected consumers to run.");
  } else {
    console.log(
      `Validating ${selectedConsumers.length} registry consumers with ${Math.min(jobs, selectedConsumers.length)} workers.`,
    );
  }

  const packageNames = [
    ...new Set(
      selectedConsumers.flatMap((consumer) => {
        const itemName = `${consumer.framework}/${consumer.recipe}`;
        const item = registry.items.find((candidate) => candidate.name === itemName);
        return localPackagesForConsumer(consumer, item);
      }),
    ),
  ];
  if (!built && selectedConsumers.length > 0) {
    await run(
      "pnpm",
      packageNames.flatMap((name) => ["--filter", name]).concat("build"),
    );
  }

  const tarballs = new Map();
  if (selectedConsumers.length > 0) {
    for (const packageName of packageNames) {
      const directory = packageDirectories[packageName];
      const tarball = join(tarballDir, `${directory}.tgz`);
      await run("pnpm", [
        "--dir",
        `packages/${directory}`,
        "pack",
        "--out",
        tarball,
      ]);
      tarballs.set(packageName, tarball);
    }
  }

  if (selectedConsumers.length > 0) {
    await run("pnpm", [
      "exec",
      "shadcn",
      "build",
      "registry.json",
      "--output",
      registryDir,
    ]);
  }

  async function validateConsumer(consumer) {
    const startedAt = performance.now();
    const itemName = `${consumer.framework}/${consumer.recipe}`;
    const consumerDir = join(
      workDir,
      `${consumer.recipe}-${consumer.framework}-consumer`,
    );
    const registryItem = registry.items.find(
      (item) => item.name === itemName,
    );
    assert(registryItem, `Missing ${itemName} registry item`);
    if (catalogRecipes.includes(consumer.recipe)) {
      assert(
        registryItem.meta?.sourceOwnership === "consumer",
        `${itemName} must declare consumer-owned recipe source`,
      );
      assert(
        registryItem.meta?.updateStrategy === "shadcn-diff",
        `${itemName} must declare the shadcn diff update strategy`,
      );
    }
    const builtItem = JSON.parse(
      readFileSync(join(registryDir, `${itemName}.json`), "utf8"),
    );
    assert(
      JSON.stringify(builtItem.dependencies) ===
        JSON.stringify(registryItem.dependencies),
      `${itemName} build changed registry dependencies`,
    );
    assert(
      JSON.stringify(builtItem.devDependencies) ===
        JSON.stringify(registryItem.devDependencies),
      `${itemName} build changed registry development dependencies`,
    );
    assert(
      JSON.stringify(builtItem.meta) === JSON.stringify(registryItem.meta),
      `${itemName} build changed registry metadata`,
    );
    const installItem = structuredClone(builtItem);
    installItem.dependencies = installItem.dependencies.map((dependency) => {
      const name = packageName(dependency);
      const tarball = tarballs.get(name);
      return tarball ? `${name}@file:${tarball}` : dependency;
    });
    localizeRegistryDependencies(installItem);
    const installItemPath = join(
      workDir,
      `${consumer.framework}-${consumer.recipe}-install.json`,
    );
    writeJson(installItemPath, installItem);
    const dependencyNames = registryItem.dependencies.map(packageName);
    const smokeFoundationDevDependencies = Object.fromEntries(
      localPackagesForConsumer(consumer, registryItem)
        .filter((name) => !dependencyNames.includes(name))
        .map((name) => [name, `file:${tarballs.get(name)}`]),
    );

    mkdirSync(consumerDir);
    writeJson(join(consumerDir, "package.json"), {
      name: `tuiparts-registry-${consumer.recipe}-${consumer.framework}-consumer`,
      private: true,
      type: "module",
      packageManager: "pnpm@10.34.5",
      dependencies: consumer.hostDependencies,
      devDependencies: {
        "@types/bun": "1.3.14",
        "@types/node": "24.13.3",
        typescript: "5.9.3",
        ...consumer.hostDevDependencies,
        ...smokeFoundationDevDependencies,
        ...consumer.devDependencies,
      },
    });
    const overrides = [...tarballs]
      .map(([name, tarball]) => `  "${name}": "file:${tarball}"`)
      .join("\n");
    writeFileSync(
      join(consumerDir, "pnpm-workspace.yaml"),
      `packages:\n  - "."\n${overrides ? `\noverrides:\n${overrides}\n` : ""}`,
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
      include: [
        ...consumer.files.map((file) => file.target),
        ...(consumer.smoke ? [consumer.smokeFile] : []),
      ],
    });
    await capture("pnpm", ["install"], consumerDir);

    const untouched = "registry installation must not modify this file\n";
    writeFileSync(join(consumerDir, "untouched.txt"), untouched);
    const beforeInstall = snapshotFiles(consumerDir);

    await capture("pnpm", [
      "exec",
      "shadcn",
      "add",
      installItemPath,
      "--cwd",
      consumerDir,
      "--yes",
    ]);

    for (const file of consumer.files) {
      assert(
        readFileSync(join(consumerDir, file.target), "utf8") ===
          readFileSync(join(root, file.source), "utf8"),
        `Installed ${itemName} recipe differs from its registry source`,
      );
    }
    if (itemName === "react/checkbox") {
      const targetPath = join(consumerDir, consumer.files[0].target);
      const localMarker = `// consumer-owned edit for ${itemName}`;
      const upstreamMarker = `// upstream recipe change for ${itemName}`;
      writeFileSync(
        targetPath,
        `${readFileSync(targetPath, "utf8")}\n${localMarker}\n`,
      );

      const updatedItem = structuredClone(installItem);
      const [updatedFile] = updatedItem.files;
      assert(
        updatedItem.files.length === 1 && updatedFile,
        `${itemName} lifecycle check expects one recipe file`,
      );
      updatedFile.content = `${updatedFile.content}\n${upstreamMarker}\n`;
      const updatedItemPath = join(
        workDir,
        `${consumer.framework}-checkbox-update.json`,
      );
      writeJson(updatedItemPath, updatedItem);

      // shadcn 4.13 installs universal items without configuration, but its
      // inspection-only flags still require the legacy project config.
      writeShadcnCompatibilityConfig(consumerDir);

      const diff = await capture("pnpm", [
        "exec",
        "shadcn",
        "add",
        updatedItemPath,
        "--cwd",
        consumerDir,
        "--yes",
        "--diff",
      ]);
      assert(
        diff.includes(localMarker) && diff.includes(upstreamMarker),
        `${itemName} diff did not expose local and upstream changes:\n${diff}`,
      );

      const editedSource = readFileSync(targetPath, "utf8");
      const updateAttempt = await capture("pnpm", [
        "exec",
        "shadcn",
        "add",
        updatedItemPath,
        "--cwd",
        consumerDir,
        "--yes",
      ]);
      assert(
        updateAttempt.includes("overwrite"),
        `${itemName} update did not ask before replacing existing source`,
      );
      assert(
        readFileSync(targetPath, "utf8") === editedSource,
        `${itemName} update silently overwrote consumer-owned source`,
      );
    }
    const afterInstall = snapshotFiles(consumerDir);
    const allowedChanges = new Set([
      "package.json",
      "pnpm-lock.yaml",
      ...(itemName === "react/checkbox" ? ["components.json"] : []),
      ...consumer.files.map((file) => file.target),
    ]);
    if (registryItem.registryDependencies?.length) {
      const themeFiles = consumerFiles(
        "theme",
        consumer.framework,
        consumer.extension,
      );
      for (const file of themeFiles) allowedChanges.add(file.target);
    }
    for (const [path, content] of afterInstall) {
      if (allowedChanges.has(path)) continue;
      assert(
        beforeInstall.get(path) === content,
        `${itemName} registry installation changed ${path}`,
      );
    }
    for (const path of beforeInstall.keys()) {
      assert(
        allowedChanges.has(path) || afterInstall.has(path),
        `${itemName} registry installation removed ${path}`,
      );
    }

    const installedPackage = JSON.parse(
      readFileSync(join(consumerDir, "package.json"), "utf8"),
    );
    const expectedInstalledDependencies = [
      ...Object.keys(consumer.hostDependencies),
      ...dependencyNames,
    ].sort();
    assert(
      JSON.stringify(Object.keys(installedPackage.dependencies).sort()) ===
        JSON.stringify(expectedInstalledDependencies),
      `${itemName} registry dependencies do not match the item`,
    );
    for (const dependency of registryItem.dependencies) {
      const name = packageName(dependency);
      installedPackage.dependencies[name] = packageRange(dependency);
    }
    writeJson(join(consumerDir, "package.json"), installedPackage);

    const installedLocalPackages = localPackagesForConsumer(
      consumer,
      registryItem,
    );
    const localLockfile = readFileSync(
      join(consumerDir, "pnpm-lock.yaml"),
      "utf8",
    );
    for (const name of installedLocalPackages) {
      assert(
        localLockfile.includes(`file:${tarballs.get(name)}`),
        `${itemName} lockfile did not resolve ${name} locally`,
      );
    }

    if (consumer.recipe === "theme") {
      for (const preset of themePresets) {
        const presetInstallPath = join(
          workDir,
          `${consumer.framework}-${preset.item}-install.json`,
        );
        writeJson(
          presetInstallPath,
          localizeRegistryDependencies(
            JSON.parse(
              readFileSync(join(registryDir, `${preset.item}.json`), "utf8"),
            ),
          ),
        );
        await capture("pnpm", [
          "exec",
          "shadcn",
          "add",
          presetInstallPath,
          "--cwd",
          consumerDir,
          "--yes",
        ]);
        assert(
          readFileSync(join(consumerDir, preset.target), "utf8") ===
            readFileSync(join(root, preset.source), "utf8"),
          `Installed ${preset.item} preset differs from its registry source`,
        );
      }
    }

    if (consumer.smoke) {
      writeFileSync(
        join(consumerDir, consumer.smokeFile),
        readFileSync(join(root, consumer.smoke), "utf8"),
      );
    }
    await capture("pnpm", ["exec", "tsc", "-p", "tsconfig.json"], consumerDir);
    if (consumer.smoke) {
      let smokeFile = consumer.smokeFile;
      if (consumer.smokeBuild) {
        await capture(
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
      await capture(
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
    console.log(
      `${itemName} passed in ${((performance.now() - startedAt) / 1000).toFixed(1)}s`,
    );
  }

  await runPool(selectedConsumers, jobs, validateConsumer);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
