# Recipe catalog

The tuiparts.sh registry distributes editable recipe source through the shadcn
CLI. Installed files belong to the consuming project. The registry does not
maintain a second package manager, recipe lockfile, or automatic merge engine.
Deployed catalog items are served at `/r/{adapter}/{recipe}.json` (for
example `r/react/checkbox.json`), which lets consumers register the
`@tuiparts` namespace once and install by name.

## Catalog

Each catalog recipe is available as `core/<name>`, `react/<name>`, and
`solid/<name>`:

| Recipe | Packaged behavior | Installed vocabulary |
| --- | --- | --- |
| Checkbox | Checkbox Root and Indicator | `Checkbox` |
| Switch | Switch Root and Thumb | `Switch` |
| Button | Button activation primitive | `Button` |
| RadioGroup/Radio | Radio collection and selectable parts | `RadioGroup`, `RadioGroupItem` |
| Input | Native OpenTUI input behavior | `Input` |
| Dialog | Overlay layers, focus containment, and dismissal | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose` |
| Badge | None; presentation-only recipe | `Badge` |
| Toggle | Standalone pressed-state primitive | `Toggle` |
| ToggleGroup/Toggle | Single or multiple selection and roving focus | `ToggleGroup`, `ToggleGroupItem` |
| Theme | None; consumer-owned token contract and store | `Tokens`, `theme`, `createThemeStore`, `tint` (+ `useTheme` in React/Solid) |

Framework-neutral preset themes are additionally available as `theme-<name>`
(currently `theme-cobalt-deep`, `theme-ascii`, `theme-catppuccin`,
`theme-gruvbox`, and `theme-rosepine`); they install to `themes/<name>.ts`
and serve one file to all three adapters.

React and Solid recipes expose the same installed names and props where their
runtime semantics permit. Core recipes expose equivalent imperative factory
functions. Core installation uses the same shadcn item lifecycle; it installs
ordinary `.ts` source rather than framework JSX.

## Compatibility

Each registry item records its framework in `meta.framework`. Interactive
recipes declare only the direct `@tuiparts/core`, `@tuiparts/react`, or
`@tuiparts/solid` package added to an existing OpenTUI application. React and
Solid adapters own their `@tuiparts/core` dependency and check the host's
OpenTUI and framework versions through peer dependencies.

The `meta.sourceOwnership` value `consumer` means the installed source is
expected to be edited locally. The `meta.updateStrategy` value `shadcn-diff`
identifies the supported update workflow. Registry metadata describes the
source lifecycle; it does not replace package dependency resolution.

Primitive-backed items target `>=0.0.1 <0.1.0`, beginning with the first
stable release in the `@tuiparts` scope and accepting compatible package
patches. Presentation-only recipes add no npm packages. Validation starts from
an isolated application with the matching OpenTUI runtime, then uses temporary
workspace overrides to resolve Foundation packages to the local packed
tarballs under test.

## Install

A consumer installs an item by its `@tuiparts` address when the shadcn Registry
Directory resolves the namespace. If it does not, the consumer configures the
same namespace URL in `components.json` or installs the item by direct URL:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

The CLI installs declared dependencies and copies the recipe into
`components/ui`. Running ordinary `add` against an existing file asks before
replacement and defaults to preserving the local file.

## Build The Registry

Registry maintainers can build every distributable item without preparing its
nested framework directories manually:

```bash
pnpm registry:build --output ./public/r
```

Application consumers use `shadcn add` against the published item address and
do not run this build command.

## Discover And Review Updates

The current registry item is the upstream recipe revision. Its Git commit, tag,
or deployed registry version identifies the exact upstream source; tuiparts.sh
does not write hidden revision state into the consumer's project.

Inspect the current upstream source and compare it with the installed file:

```bash
pnpm dlx shadcn@4.13.0 add <item-address> --view
pnpm dlx shadcn@4.13.0 add <item-address> --diff
pnpm dlx shadcn@4.13.0 add <item-address> --dry-run
```

Review the diff and merge useful upstream changes into the consumer-owned file.
Use `--overwrite` only when intentionally discarding local edits. Ordinary
updates must never rely on unattended overwrite.

## Theming

Every recipe reads its colors, glyphs, and density from the consumer-owned
theme file rather than hard-coding literals. Recipe items declare their
adapter's `theme` item in `registryDependencies`, so installing any recipe
also installs `components/ui/theme.ts` (plus a small
`components/ui/use-theme.tsx` binding in React and Solid) — the terminal
analog of `globals.css` plus `lib/utils.ts`.

The installed theme file contains the whole mechanism: the `Tokens` contract,
a small subscription store, and a default theme built from ANSI-indexed
colors so apps inherit the terminal user's own palette and transparency.
There is no packaged theme runtime (see ADR 0006). The lifecycle is:

- **Customize** by editing the file: change default tokens, or extend the
  `Tokens` interface with app-specific tokens that flow through the same
  pipeline.
- **Add presets** with `shadcn add theme-<name>`, then register them in one
  line (`themes: { "cobalt-deep": cobaltDeep }`). Presets are
  `DeepPartial<Tokens>` overrides merged over the consumer's base: missing
  keys fall back, and consumer token extensions never break a preset install.
- **Switch and adapt** at runtime with `theme.setActive(name)` and
  `theme.setMode("system" | "dark" | "light")`; `theme.follow(renderer)`
  keeps system mode in sync with the terminal's live light/dark signal.
  Persisting the choice or discovering user-supplied theme files are
  consumer-side patterns built on `theme.subscribe` and `theme.register`;
  the registry ships neither.
- **Update** the theme file like any recipe, through the shadcn diff
  workflow.

## Primitive Upgrades Versus Recipe Updates

Primitive packages own behavior, state, focus, keyboard and pointer handling,
and lifecycle fixes. Update those packages with the project's package manager,
subject to the recipe item's declared version ranges.

Registry recipes own presentation and convenience composition. A recipe update
is optional source integration unless its release notes explicitly identify a
required compatibility change. Consumers inspect and merge those changes with
shadcn's diff workflow.

## Consumer-Owned Presentation

Starter palettes, density choices, and symbol sets live in the consumer-owned
theme file; recipes read them as tokens from that sibling installed source,
and labels plus per-instance marks stay directly in each recipe. All of it is
example source that consumers edit or replace, not package APIs or
dependencies on a hidden theme runtime.

## Verification

`pnpm validate:registry` verifies the catalog's dependencies, lifecycle
metadata, and matching React/Solid vocabulary. It builds every registry item
with the pinned official shadcn CLI, creates an isolated strict OpenTUI host
for each runtime, and installs every item with bounded concurrency (30
consumers; the framework-neutral preset items install and byte-compare inside
the three theme consumers, whose smokes exercise them). It resolves each
Recipe's Theme `registryDependencies` from the locally built Registry,
type-checks everything, and runs the runtime smokes. React Checkbox
additionally applies a local edit, creates a newer upstream payload, verifies
`--diff` shows both changes, and proves ordinary `add` does not overwrite the
local source; that installer behavior is framework-independent.

Use `--recipe=<name>` or `--framework=<core|react|solid>` for focused local
feedback, and combine them when only one consumer matters. CI uses `--built`
to reuse the workspace build. Pull requests add `--since=origin/main` to run
only affected consumers after the fast whole-catalog structural checks; main
and release workflows always run the exhaustive matrix.
