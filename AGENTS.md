# PROJECT KNOWLEDGE BASE

**Updated:** 2026-07-12
**Branch:** feat/codebase-cleaning

## OVERVIEW

Terminal primitive and editable-recipe ecosystem for OpenTUI. The monorepo is
migrating from hybrid packaged components to framework-neutral Core behavior,
React/Solid compound-part adapters, and shadcn-compatible consumer-owned
recipes. The styling engine is optional recipe infrastructure.

## STRUCTURE

```
opentui-ui/
├── packages/
│   ├── core/         # Framework-neutral primitive behavior + legacy components
│   ├── styles/       # Optional recipe styling (styled(), variants, slots)
│   ├── react/        # React primitive adapters + legacy bindings
│   ├── solid/        # Solid primitive adapters + legacy bindings
│   ├── dialog/       # Dialog/modal system with async prompt/confirm/alert/choice
│   ├── toast/        # Sonner-inspired toast notifications with theming
│   └── utils/        # Shared utilities (padding resolution, etc.)
├── examples/         # Example apps (mostly empty)
├── registry/         # Consumer-owned Core/React/Solid recipe source
├── .scratch/         # Local executable migration specs and tickets
├── benchmarks/       # Performance benchmarks
└── scripts/          # Package scaffolding
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/migrate primitive | `.scratch/opentui-primitives-v1/issues/` | Work only the current dependency frontier |
| Primitive architecture | `PRIMITIVES_AND_RECIPES.md` | Package behavior; copy opinionated recipes |
| Migration roadmap | `ROADMAP.md`, `.scratch/opentui-primitives-v1/` | Durable phases + local executable tickets |
| Editable recipes | `registry/` | Framework-specific source built on packaged primitives |
| React binding | `packages/react/src/` | Mirrors core structure |
| Solid binding | `packages/solid/src/` | Mirrors core structure |
| Styling API | `packages/styles/src/` | `styled.ts` is the factory |
| State resolution | `packages/styles/src/resolve.ts` | Variant + state style resolution |
| Style merging | `packages/styles/src/merge.ts` | Slot style composition |
| New package | `./scripts/create-package.sh` | Scaffolds package structure |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `createStyled` | Function | `packages/styles/src/styled.ts` | Factory for styled component definitions |
| `createStyleResolver` | Function | `packages/styles/src/resolve.ts` | Resolves styles from config + state |
| `processStyledConfig` | Function | `packages/styles/src/resolve.ts` | Pre-processes config for performance |
| `withStyles` | Function | `packages/core/src/styled-renderable.ts` | Legacy/recipe style mixin; not the primitive base contract |
| `BadgeRenderable` | Class | `packages/core/src/badge/badge.ts` | Badge component logic |
| `CheckboxRenderable` | Class | `packages/core/src/checkbox/checkbox.ts` | Checkbox component logic |
| `CheckboxStore` | Class | `packages/core/src/checkbox/primitive.ts` | Shared Checkbox primitive state |
| `splitVariantProps` | Function | `packages/styles/src/styled.ts` | Separates variant props from rest |
| `toast` | Object | `packages/toast/src/state.ts` | Global toast API (toast.success, toast.error, etc.) |
| `ToasterRenderable` | Class | `packages/toast/src/renderables/toaster.ts` | Container that manages toast notifications |
| `DialogManager` | Class | `packages/dialog/src/manager.ts` | Manages dialog state with prompt/confirm/alert/choice |
| `DialogContainerRenderable` | Class | `packages/dialog/src/renderables/dialog-container.ts` | Container that renders dialogs with backdrop |

## CONVENTIONS

- **pnpm workspace** - Use `pnpm -r` for recursive commands
- **ES Modules** - All packages use `"type": "module"`
- **Biome** - Linting/formatting (spaces, double quotes)
- **tsdown** - Bundler for all packages
- **Changesets** - Versioning (core/react/solid/styles linked)
- **Catalog deps** - Peer deps use `"catalog:"` in package.json
- **Source-first exports** - Dev uses `./src/`, publishConfig has `./dist/`
- **verbatimModuleSyntax** - Explicit `type` imports required
- **noUncheckedIndexedAccess** - Index returns `T | undefined`

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use tabs (project uses 2-space indent)
- **DO NOT** skip `type` keyword for type-only imports
- **DO NOT** skip public-behavior tests; Core, React, and Solid use Bun tests at their supported seams
- **DO NOT** ignore biome-ignore comments without justification

## UNIQUE STYLES

- **Public parts** - Primitives expose independently composable nodes; parts are not merely style slots
- **Recipe styling** - Consumer-owned recipes may expose slots, variants, and state selectors
- **State selectors** - Recipe styles target metadata states with `_checked`, `_focused`, and similar keys
- **Component meta** - Components carry metadata via `$$OtuiComponentMeta` symbol
- **Migration pattern** - New primitive behavior follows the active ticket contract; legacy components still use `withStyles`

## COMMANDS

```bash
pnpm build           # Build all packages
pnpm typecheck       # Type-check all packages
pnpm lint            # Lint with Biome
pnpm format          # Format with Biome
pnpm changeset       # Create a changeset
pnpm release         # Build + publish
pnpm create <name>   # Scaffold new package
```

## NOTES

- **Migration in progress**: Existing packaged components remain during expand-contract and are not the stable v1 interface
- **Linked versioning**: core, react, solid, styles version together
- **OpenTUI peer deps**: Uses pnpm catalog for `@opentui/core`, `@opentui/react`, `@opentui/solid`
