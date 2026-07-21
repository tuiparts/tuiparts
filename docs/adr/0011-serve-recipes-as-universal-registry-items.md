---
status: accepted
---

# Serve Recipes as universal Registry items

## Context

The shadcn CLI normally requires a web-oriented `components.json` containing
Tailwind, React Server Component, style, and alias metadata before it installs
`registry:ui` items. OpenTUI applications do not use those concepts, and the
CLI's framework initializer does not recognize OpenTUI projects.

shadcn supports universal Registry items for source with explicit targets.
Universal items install without framework detection or `components.json` and
retain the CLI's dependency installation and collision protection.

## Decision

Every tuiparts.sh Recipe, Theme, and Theme preset is served as a top-level
`registry:item`. Every distributed file uses `registry:file` with an explicit
consumer target. Registry dependencies must also resolve to universal items so
the complete installation remains configuration-free.

The official shadcn CLI remains the installer. tuiparts.sh does not maintain a
parallel installer, Recipe lockfile, or merge engine.

Clean-consumer validation must install every item without `components.json`.
Lifecycle validation continues to cover non-overwrite behavior and shadcn's
source inspection commands. shadcn 4.13 still requires its legacy project
configuration for `--diff`, `--view`, and `--dry-run`; this compatibility
limitation is documented separately from the normal installation path.

## Consequences

- A fresh OpenTUI project can install a Recipe without irrelevant web
  configuration.
- Registry payloads own deterministic target paths rather than deriving them
  from shadcn aliases.
- shadcn remains responsible for package installation, dependency traversal,
  collision handling, and optional source inspection.
- Consumers that want shadcn's inspection-only flags must currently provide a
  valid `components.json` until upstream supports those flags for universal
  items.
