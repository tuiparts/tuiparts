# packages/core

Framework-neutral primitive behavior and Renderables that React/Solid adapters
wrap. This package owns interaction and lifecycle, not recipe presentation.

## WHERE TO LOOK

| Task | File(s) | Notes |
|------|---------|-------|
| Add/migrate primitive | `../../.scratch/opentui-primitives-v1/issues/` | Work only the current frontier contract |
| Primitive behavior | Active ticket contract | Store, public parts, state, events, refs, actions |
| Primitive tracer | `src/checkbox/primitive.ts` | Store + public Root/Indicator behavior pattern |
| Barrel export | `src/<name>/index.ts` | Re-exports the component's public API |
| Root exports | `src/index.ts` | Re-exports foundation components |

## ANTI-PATTERNS

- **DO NOT** add framework-specific code (React hooks, Solid signals)
- **DO NOT** put colors, glyph sets, themes, semantic variants, fixed labels, or opinionated visual assembly in primitives
- **DO NOT** treat a recipe style slot as equivalent to a public composition part
- **DO NOT** attach recipe metadata or styling ownership to primitive Renderables
- **DO NOT** forget the package subpath export for a new component
- **DO NOT** use `@opentui/core` types without the explicit `type` import keyword
- **DO NOT** create per-component `*LayoutProps` types; native OpenTUI options already carry layout properties
- **DO NOT** import from `@opentui-ui/utils` from in-scope packages
  (core/react/solid). The `utils` package is currently
  toast/dialog-internal-by-coincidence and not part of the foundation.
