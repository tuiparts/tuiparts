# Foundation Recipe Catalog

The OpenTUI UI registry distributes editable recipe source through the shadcn
CLI. Installed files belong to the consuming project. The registry does not
maintain a second package manager, recipe lockfile, or automatic merge engine.

## Catalog

Each foundation recipe is available as `core/<name>`, `react/<name>`, and
`solid/<name>`:

| Recipe | Packaged behavior | Installed vocabulary |
| --- | --- | --- |
| Checkbox | Checkbox Root and Indicator | `Checkbox` |
| Switch | Switch Root and Thumb | `Switch` |
| Button | Button activation primitive | `Button` |
| RadioGroup/Radio | Radio collection and selectable parts | `RadioGroup`, `RadioGroupItem` |
| Input | Native OpenTUI input behavior | `Input` |
| Badge | None; presentation-only recipe | `Badge` |

React and Solid recipes expose the same installed names and props where their
runtime semantics permit. Core recipes expose equivalent imperative factory
functions. Core installation uses the same shadcn item lifecycle; it installs
ordinary `.ts` source rather than framework JSX.

The registry also contains a validated preview Dialog recipe, but it is not
part of this starter catalog. The already-adopted `@opentui-ui/dialog` and
`@opentui-ui/toast` packages remain the production companion paths. The preview
recipe does not replace either package.

## Compatibility

Each registry item records its framework in `meta.framework` and declares its
compatible primitive and OpenTUI package ranges in `dependencies`. The
`meta.sourceOwnership` value `consumer` means the installed source is expected
to be edited locally. The `meta.updateStrategy` value `shadcn-diff` identifies
the supported update workflow.

Package ranges are the compatibility contract. Registry metadata describes the
source lifecycle; it does not replace package dependency resolution.

Foundation primitive items target `^0.0.3-rc.0`, so installations select the
foundation RC rather than incompatible pre-foundation packages. Validation
preserves those declared ranges while temporary workspace overrides resolve
them to the local packed tarballs under test.

## Install

A consumer configures shadcn with a `components.json` file, then installs the
item address published for its framework:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

The CLI installs declared dependencies and copies the recipe into
`components/ui`. Running ordinary `add` against an existing file asks before
replacement and defaults to preserving the local file.

## Discover And Review Updates

The current registry item is the upstream recipe revision. Its Git commit, tag,
or deployed registry version identifies the exact upstream source; OpenTUI UI
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

## Primitive Upgrades Versus Recipe Updates

Primitive packages own behavior, state, focus, keyboard and pointer handling,
and lifecycle fixes. Update those packages with the project's package manager,
subject to the recipe item's declared version ranges.

Registry recipes own presentation and convenience composition. A recipe update
is optional source integration unless its release notes explicitly identify a
required compatibility change. Consumers inspect and merge those changes with
shadcn's diff workflow.

## Consumer-Owned Presentation

Starter palettes, density choices, labels, marks, and symbol sets live directly
in the installed files. They are examples that consumers can edit or replace,
not package APIs or dependencies on a hidden theme runtime.

## Verification

`pnpm validate:registry` verifies the catalog's dependencies, lifecycle
metadata, and matching React/Solid vocabulary. It builds every registry item
with the pinned official shadcn CLI, installs all 21 items into isolated strict
consumers with bounded concurrency, type-checks them, and runs their runtime
smokes. React Checkbox additionally applies a local edit, creates a newer
upstream payload, verifies `--diff` shows both changes, and proves ordinary
`add` does not overwrite the local source; that installer behavior is
framework-independent.

Use `--recipe=<name>` or `--framework=<core|react|solid>` for focused local
feedback, and combine them when only one consumer matters. CI uses `--built`
to reuse the workspace build. Pull requests add `--since=origin/main` to run
only affected consumers after the fast whole-catalog structural checks; main
and release workflows always run the exhaustive matrix.
