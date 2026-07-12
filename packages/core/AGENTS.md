# packages/core

Framework-neutral primitive behavior and Renderables that React/Solid adapters
wrap. During migration, this package also contains legacy hybrid components;
do not use those as precedent for new primitive visual ownership.

## WHERE TO LOOK

| Task | File(s) | Notes |
|------|---------|-------|
| Add/migrate primitive | `../../.scratch/opentui-primitives-v1/issues/` | Work only the current frontier contract |
| Legacy recipe styling | `src/styled-renderable.ts` | Existing hybrid components only during migration |
| Legacy component types | `src/<name>/types.ts` | Existing slots, state, options, style maps |
| Legacy metadata | `src/<name>/meta.ts` | Existing `styled()` recipe bridge |
| Legacy constants | `src/<name>/constants.ts` | Existing slots/defaults pending recipe migration |
| Primitive behavior | Active ticket contract | Store, public parts, state, events, refs, actions |
| Primitive tracer | `src/checkbox/primitive.ts` | Store + public Root/Indicator behavior pattern under evaluation |
| Barrel export | `src/<name>/index.ts` | Re-exports all public API |
| Root exports | `src/index.ts` | Must export new component here |

## LEGACY COMPONENT STRUCTURE

Existing hybrid component folders commonly contain:

```
src/<name>/
├── index.ts      # Barrel export
├── types.ts      # Slots, State, Options, SlotStyleMap interfaces
├── constants.ts  # SLOTS tuple, SLOT_STYLE_MAP, DEFAULT_OPTIONS
├── meta.ts       # Legacy recipe metadata for styled() inference
└── <name>.ts     # <Name>Renderable class
```

## LEGACY SLOT SYSTEM

- **Slots**: Named style targets in legacy hybrid components; not public composition parts
- **SlotStyles**: Object mapping slot names to style properties
- **SlotStyleMap**: Type defining allowed style props per slot
- **State**: Object with boolean keys (e.g., `checked`, `focused`, `disabled`)
- **StyleResolver**: Function `(state) => SlotStyles` for dynamic styling

## ANTI-PATTERNS

- **DO NOT** add framework-specific code (React hooks, Solid signals)
- **DO NOT** put colors, glyph sets, themes, semantic variants, fixed labels, or opinionated visual assembly in new primitives
- **DO NOT** treat a style slot as equivalent to a public composition part
- **DO NOT** copy the legacy five-file/meta structure into a new primitive unless the frozen primitive contract explicitly requires it
- **DO NOT** forget to add subpath export in `package.json` for new components
- **DO NOT** use `@opentui/core` types without explicit `type` import keyword
- **DO NOT** create per-component `*LayoutProps` types in framework bindings —
  layout props (`width`, `height`, `padding*`, `margin*`, `flex*`, …) are
  already on every component's `*Options` type via the
  `StyledOptions → RenderableOptions` inheritance chain.
- **DO NOT** import from `@opentui-ui/utils` from in-scope packages
  (core/styles/react/solid). The `utils` package is currently
  toast/dialog-internal-by-coincidence and not part of the foundation.
