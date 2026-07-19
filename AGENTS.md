# PROJECT KNOWLEDGE BASE

**Updated:** 2026-07-19
## OVERVIEW

tuiparts.sh — the primitive and recipe ecosystem for OpenTUI (npm scope
`@tuiparts`). The monorepo is built around framework-neutral Core behavior,
React/Solid compound-part adapters, and shadcn-compatible consumer-owned
recipes written with plain TypeScript and native OpenTUI properties.
Canonical vocabulary: packaged behavior units are Primitives exposing Parts;
copied styled source is a Recipe; the user-facing surface is the Catalog and
the serving layer is the Registry. Never call a packaged primitive a
"component" in brand copy.

## STRUCTURE

```
tuiparts/
├── packages/
│   ├── core/         # Framework-neutral primitive behavior
│   ├── react/        # React primitive adapters
│   ├── solid/        # Solid primitive adapters
│   ├── dialog/       # Independently versioned Dialog companion package
│   ├── toast/        # Independently versioned Toast companion package
│   └── utils/        # Shared utilities (padding resolution, etc.)
├── registry/         # Consumer-owned Core/React/Solid recipe source
└── scripts/          # Registry build and foundation validation scripts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/change primitive | `FOUNDATION_PRIMITIVE_CONTRACT.md` | Start with the public contract and applicable conformance rows |
| Primitive architecture | `PRIMITIVES_AND_RECIPES.md` | Package behavior; copy opinionated recipes |
| Architecture decisions | `docs/adr/` | Read accepted ADRs before changing public APIs, ownership, package boundaries, or adapter state flow |
| Foundation usage | `docs/foundation.md` | Package versus registry choice and public component matrix |
| Brand rules & tokens | `docs/brand/` | Figure style guide, logomark, Kit sheet, design tokens (web + terminal) |
| Editable recipes | `registry/` | Framework-specific source built on packaged primitives |
| React binding | `packages/react/src/` | Mirrors core structure |
| Solid binding | `packages/solid/src/` | Mirrors core structure |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `PressableRenderable` | Class | `packages/core/src/internal/pressable.ts` | Shared activation behavior (guards, pointer model, focus sync) for all press-activated Roots (ADR-0007) |
| `CheckboxRootRenderable` | Class | `packages/core/src/checkbox/primitive.ts` | Checkbox Root adapter over shared checked state and activation |
| `CheckedStore` | Class | `packages/core/src/internal/checked-store.ts` | Shared checked-state behavior for Checkbox and Switch |
| `toast` | Object | `packages/toast/src/state.ts` | Global toast API (toast.success, toast.error, etc.) |
| `ToasterRenderable` | Class | `packages/toast/src/renderables/toaster.ts` | Container that manages toast notifications |
| `DialogStore` | Class | `packages/core/src/dialog/primitive.ts` | Foundation Dialog state and layer coordination |
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
- **Primitive implementation** - New behavior follows the foundation contract; recipes do not create behaviorless package components

## COMMANDS

```bash
pnpm build           # Build all packages
pnpm typecheck       # Type-check all packages
pnpm lint            # Lint with Biome
pnpm format          # Format with Biome
pnpm changeset       # Create a changeset
pnpm release         # Build + publish
```

## NOTES

- **Companion boundary**: Dialog primitive behavior is in Core/React/Solid;
  `@tuiparts/dialog` and `@tuiparts/toast` remain adopted, independently
  versioned companion products outside the foundation release line.
- **Linked versioning**: core, react, and solid version together
- **OpenTUI peer deps**: Uses pnpm catalog for `@opentui/core`, `@opentui/react`, `@opentui/solid`
