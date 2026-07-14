# Badge Recipe

Badge is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createBadge` recipe.
- `react.tsx` exports the React `Badge` recipe.
- `solid.tsx` exports the Solid `Badge` recipe.

The recipes choose label assembly, intent palettes, size, padding, and default
colors. Native root properties and `labelOptions` are applied after those
defaults, so applications can customize an instance or edit the source without
wrapping an opaque package component.
