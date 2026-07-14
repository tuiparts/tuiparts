# Registry Lifecycle

The OpenTUI UI registry distributes editable recipe source through the shadcn
CLI. Installed files belong to the consuming project. The registry does not
maintain a second package manager, recipe lockfile, or automatic merge engine.

## Compatibility

Each registry item records its framework in `meta.framework` and declares its
compatible primitive and OpenTUI package ranges in `dependencies`. The
`meta.sourceOwnership` value `consumer` means the installed source is expected
to be edited locally. The `meta.updateStrategy` value `shadcn-diff` identifies
the supported update workflow.

Package ranges are the compatibility contract. Registry metadata describes the
source lifecycle; it does not replace package dependency resolution.

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

## Verification

`pnpm validate:registry` validates `registry.json` with the pinned official
shadcn CLI. For Checkbox in Core, React, and Solid it also installs the recipe,
applies a local edit, creates a newer upstream payload, verifies `--diff` shows
both changes, and proves ordinary `add` does not overwrite the local source.
