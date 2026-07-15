# OpenTUI UI

Composable, framework-neutral interaction primitives and editable UI recipes
for [OpenTUI](https://github.com/anomalyco/opentui).

The project uses a Base UI/shadcn-inspired architecture:

> Package the difficult behavior. Copy the opinionated layer.

- Versioned packages own state, keyboard/pointer interaction, focus,
  collections, overlays, lifecycle, public parts, and framework adapters.
- Registry recipes own glyphs, layout, colors, themes, semantic variants, and
  convenience assembly in source controlled by the application.

See [`PRIMITIVES_AND_RECIPES.md`](./PRIMITIVES_AND_RECIPES.md) for the product
architecture and [`FOUNDATION_PRIMITIVE_CONTRACT.md`](./FOUNDATION_PRIMITIVE_CONTRACT.md)
for the primitive contract.

Start with the [foundation guide](./docs/foundation.md) to choose package
primitives or editable recipes and see the Core, React, Solid, Dialog, and
Toast boundaries.

## Foundation Packages

| Package | Purpose |
| --- | --- |
| [`@tuiparts/core`](./packages/core) | Framework-neutral primitive state and Renderables |
| [`@tuiparts/react`](./packages/react) | React compound-part adapters |
| [`@tuiparts/solid`](./packages/solid) | Solid compound-part adapters |
| [`registry`](./registry) | Consumer-owned Core, React, and Solid recipes plus their install/update lifecycle |

Button, Checkbox, Dialog, Input, RadioGroup, and Switch expose foundation
behavior. Badge is distributed
only as editable registry source because it has no reusable interaction
behavior. [`@tuiparts/dialog`](./packages/dialog) and
[`@tuiparts/toast`](./packages/toast) remain independently versioned companion
products with higher-level APIs outside the foundation release line.

The foundation registry catalog contains Checkbox, Switch, Button,
RadioGroup/Radio, Input, and Badge recipes for Core, React, and Solid. See the
[`registry` catalog and lifecycle](./registry/README.md) for installation and
consumer-owned update guidance.

## Package Installation

Choose one adapter and install its OpenTUI peers. For example:

```bash
pnpm add @tuiparts/react @tuiparts/core \
  @opentui/core @opentui/react react
```

```bash
pnpm add @tuiparts/solid @tuiparts/core \
  @opentui/core @opentui/solid solid-js
```

See the package READMEs for exact peer ranges and usage.

## Recipe Installation

Recipes are installed with the official shadcn CLI and become application-owned
source. Choose the `core/*`, `react/*`, or `solid/*` item for your runtime:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

See the [foundation guide](./docs/foundation.md) for the starter catalog and
the [registry lifecycle](./registry/README.md) for safe update commands.

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

## License

MIT
