# packages/styles

Optional, framework-neutral styling infrastructure for consumer-owned recipes.
Primitive packages do not depend on this package.

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Define/compose a recipe | `src/recipe.ts` | Explicit recipe contracts, variants, resolution, prop splitting |
| Resolve styles | `src/resolve.ts` | Base, variants, compounds, inline, per-layer state selectors |
| Merge recipes | `src/merge.ts` | Composition merge rules |
| Assign an imperative slot | `src/assign.ts` | Normalization, reset, and redundant-assignment avoidance |
| Public exports | `src/index.ts` | Keep the module surface narrow |
| Framework fixtures | `fixtures/` | Strict React and Solid recipe examples |

## PATTERNS

- Recipe contracts declare private style slots and allowed state selector keys.
- Public primitive parts are never inferred from or represented by recipe slots.
- Variant names cannot collide with component behavior, content, native, or event props.
- Resolution order is base, variants, compounds, then inline styles.
- Active state selectors resolve inside each layer.
- `extendRecipe()` retains inherited variants and adds or extends values.
- React may use the recipe's `splitProps()` convenience.
- Solid uses Solid's `splitProps()` so recipe inputs remain reactive.
- `assignStyleProps()` is only for imperative Core recipes; declarative adapters
  pass resolved slot properties to ordinary OpenTUI nodes and primitive parts.

## ANTI-PATTERNS

- **DO NOT** wrap primitive components or register Renderables here.
- **DO NOT** attach metadata symbols to primitive components.
- **DO NOT** retain root props, authored slot layers, or duplicate component state.
- **DO NOT** add framework dependencies to the published runtime surface.
