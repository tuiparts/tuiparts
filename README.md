# OpenTUI UI

Composable, framework-neutral interaction primitives and editable UI recipes
for [OpenTUI](https://github.com/anomalyco/opentui).

The project is migrating to a Base UI/shadcn-inspired architecture:

> Package the difficult behavior. Copy the opinionated layer.

- Versioned packages own state, keyboard/pointer interaction, focus,
  collections, overlays, lifecycle, public parts, and framework adapters.
- Registry recipes own glyphs, layout, colors, themes, semantic variants, and
  convenience assembly in source controlled by the application.

See [`ROADMAP.md`](./ROADMAP.md) and
[`PRIMITIVES_AND_RECIPES.md`](./PRIMITIVES_AND_RECIPES.md).

## Foundation Packages

| Package | Purpose |
| --- | --- |
| [`@opentui-ui/core`](./packages/core) | Framework-neutral primitive state and Renderables |
| [`@opentui-ui/styles`](./packages/styles) | Optional recipe variants, selectors, and composition |
| [`@opentui-ui/react`](./packages/react) | React compound-part adapters |
| [`@opentui-ui/solid`](./packages/solid) | Solid compound-part adapters |
| [`registry`](./registry) | Consumer-owned Core, React, and Solid recipes |

The repository is in an expand-contract migration. Button, Checkbox, Dialog,
Input, RadioGroup, and Switch expose foundation behavior. Badge is distributed
only as editable registry source because it has no reusable interaction
behavior. [`@opentui-ui/dialog`](./packages/dialog) and
[`@opentui-ui/toast`](./packages/toast) remain independently versioned companion
products while their primitive relationships are reconciled.

## Installation

Published package installation remains unchanged during the expand phase.
Choose one adapter and install its OpenTUI peers. For example:

```bash
pnpm add @opentui-ui/react @opentui-ui/core \
  @opentui/core @opentui/react react ws
```

```bash
pnpm add @opentui-ui/solid @opentui-ui/core \
  @opentui/core @opentui/solid solid-js
```

Install `@opentui-ui/styles` separately when authoring typed recipe variants,
selectors, or styled composition. Primitive behavior does not require it.

See the package READMEs for exact peer ranges and usage.

## Development

The repository uses pnpm and Bun. Versions are pinned in `package.json` and CI.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm validate:packages
```

`validate:packages` packs the foundation and changed companion packages, runs
publint and Are the Types Wrong, installs the tarballs in a clean consumer,
typechecks every exported subpath, and executes representative runtime imports.

## Release Workflow

1. Add changesets for publishable changes.
2. Merge the generated version PR after CI passes.
3. Publish with npm provenance through the release workflow.
4. Validate prereleases in clean consumers before promoting a stable tag.

The local migration specification and ticket graph live under
`.scratch/opentui-primitives-v1/`.

## License

MIT
