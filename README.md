# tuiparts.sh

The primitive and recipe ecosystem for
[OpenTUI](https://github.com/anomalyco/opentui).

```
BEHAVIOR: packaged.
STYLE:    yours.
```

Parts for terminal interfaces. Some assembly encouraged.

```
        2 ─╌╌╌ ✓

        1 ─╌╌ ┌─┐
              └─┘

  FIG. 1 — CHECKBOX, EXPLODED VIEW
  1. Root   2. Indicator
```

tuiparts.sh ships in two halves:

- **Primitives** — npm packages that own the difficult, unstyled behavior:
  state, focus, keyboard and pointer handling, overlays, collections. Every
  Primitive exposes independently composable public **Parts** (Root,
  Indicator, and so on) — the diagram above is not a metaphor.
- **Recipes** — styled component source you copy into your repo and own
  outright. Recipes compose Parts and own every glyph, color, and layout
  decision.

> Package the difficult behavior. Copy the opinionated layer.

Architecture references: [`PRIMITIVES_AND_RECIPES.md`](./PRIMITIVES_AND_RECIPES.md)
for the product architecture, [`PRIMITIVE_CONTRACT.md`](./PRIMITIVE_CONTRACT.md)
for the primitive contract, and the [primitive and recipe guide](./docs/primitives-and-recipes.md)
to choose packaged Primitives or editable Recipes.

(Pronounced "too-ee parts." That is the only time we will bring it up.)

## Foundation

The Foundation is the linked-version release line: core, react, and solid
version together.

| Package | Purpose |
| --- | --- |
| [`@tuiparts/core`](./packages/core) | Framework-neutral Primitive state and Renderables |
| [`@tuiparts/react`](./packages/react) | React compound-part Adapter |
| [`@tuiparts/solid`](./packages/solid) | Solid compound-part Adapter |

Button, Checkbox, Dialog, Input, RadioGroup, Switch, Toggle, and ToggleGroup expose Primitive
behavior. Badge is distributed only as editable Recipe source because it has
no reusable interaction behavior.

The [Catalog](./registry) distributes consumer-owned Core, React, and Solid
Recipes with their install and update lifecycle.

[`@tuiparts/dialog`](./packages/dialog) and
[`@tuiparts/toast`](./packages/toast) are Companion packages: independently
versioned convenience products with higher-level APIs outside the Foundation
release line.

## Install an Adapter

Add one Adapter to an existing OpenTUI application. The React and Solid
Adapters install `@tuiparts/core`; your application already owns its OpenTUI
runtime and framework peers.

```bash
pnpm add @tuiparts/react
```

```bash
pnpm add @tuiparts/solid
```

See the package READMEs for exact peer ranges and usage.

## Install a Recipe

Recipes are installed with the official shadcn CLI and become
application-owned source. The Catalog contains Checkbox, Switch, Button,
RadioGroup/Radio, Toggle, ToggleGroup, Input, Dialog, and Badge Recipes; every Recipe targets exactly one
Adapter, so choose the `core/*`, `react/*`, or `solid/*` item for your
runtime:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

Editing the copied source is not a workaround — it is the intended
maintenance model. See the [primitive and recipe guide](./docs/primitives-and-recipes.md) for the
starter Catalog and the [Catalog lifecycle](./registry/README.md) for safe
update commands.

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

`validate:packages` packs the Foundation and changed Companion packages, runs
publint and Are the Types Wrong, installs the tarballs in a clean consumer,
typechecks every exported subpath, and executes representative runtime imports.

## Release Workflow

1. Add changesets for publishable changes.
2. Merge the generated version PR after CI passes.
3. Publish with npm provenance through the release workflow.
4. Validate packed packages in clean consumers before publishing.

## Attribution

tuiparts.sh is an independent project built for OpenTUI. It is not affiliated
with, or endorsed by, the OpenTUI project.

## License

MIT
