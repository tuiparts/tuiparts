# PROJECT KNOWLEDGE BASE

**Updated:** 2026-07-14
**Branch:** feat/codebase-cleaning

## OVERVIEW

Terminal primitive and editable-recipe ecosystem for OpenTUI. The monorepo is
migrating from hybrid packaged components to framework-neutral Core behavior,
React/Solid compound-part adapters, and shadcn-compatible consumer-owned
recipes written with plain TypeScript and native OpenTUI properties.

## STRUCTURE

```
opentui-ui/
├── packages/
│   ├── core/         # Framework-neutral primitive behavior
│   ├── react/        # React primitive adapters
│   ├── solid/        # Solid primitive adapters
│   ├── dialog/       # Temporary Dialog compatibility/convenience package
│   ├── toast/        # Temporary Toast compatibility/convenience package; move unproven
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
| Architecture decisions | `docs/adr/` | Read accepted ADRs before changing public APIs, ownership, package boundaries, or adapter state flow |
| Migration roadmap | `ROADMAP.md`, `.scratch/opentui-primitives-v1/` | Durable phases + local executable tickets |
| Editable recipes | `registry/` | Framework-specific source built on packaged primitives |
| React binding | `packages/react/src/` | Mirrors core structure |
| Solid binding | `packages/solid/src/` | Mirrors core structure |
| New package | `./scripts/create-package.sh` | Scaffolds package structure |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `CheckboxRootRenderable` | Class | `packages/core/src/checkbox/primitive.ts` | Checkbox state, activation, and Indicator owner |
| `toast` | Object | `packages/toast/src/state.ts` | Global toast API (toast.success, toast.error, etc.) |
| `ToasterRenderable` | Class | `packages/toast/src/renderables/toaster.ts` | Container that manages toast notifications |
| `DialogStore` | Class | `packages/core/src/dialog/index.ts` | Foundation Dialog state and layer coordination |
| `DialogManager` | Class | `packages/dialog/src/manager.ts` | Production convenience state with prompt/confirm/alert/choice |
| `DialogContainerRenderable` | Class | `packages/dialog/src/renderables/dialog-container.ts` | Container that renders dialogs with backdrop |

## CONVENTIONS

- **Accepted ADRs are binding context** - Read `docs/adr/*.md` before architectural work and update or supersede the relevant ADR when a decision changes
- **pnpm workspace** - Use `pnpm -r` for recursive commands
- **ES Modules** - All packages use `"type": "module"`
- **Biome** - Linting/formatting (spaces, double quotes)
- **tsdown** - Bundler for all packages
- **Changesets** - Versioning (core/react/solid linked)
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
- **Passive part ownership** - State-reflecting parts consume their Core Store directly; do not fake a Root or subclass a part just to adapt Store ownership
- **Framework adapters** - Put same-instance Store setters on Core Renderables; do not subclass solely to make reconciler prop assignment legal
- **Recipe styling** - Consumer-owned recipes use ordinary TypeScript and native OpenTUI properties
- **Migration pattern** - New primitive behavior follows the active ticket contract; recipes do not create behaviorless package components

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
- **Companion boundary**: Dialog primitive behavior is in Core/React/Solid;
  `@opentui-ui/dialog` is a temporary compatibility/convenience package to
  rebuild on or shim it. Toast still requires separate migration evidence.
- **Linked versioning**: core, react, and solid version together
- **OpenTUI peer deps**: Uses pnpm catalog for `@opentui/core`, `@opentui/react`, `@opentui/solid`
