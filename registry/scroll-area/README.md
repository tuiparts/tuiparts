# ScrollArea Recipe

ScrollArea is consumer-owned presentation, not a packaged primitive. These registry
items install editable source wrapping OpenTUI's native high-performance
`ScrollBoxRenderable` / `<scrollbox>`:

- `core.ts` exports the imperative `createScrollArea` recipe.
- `react.tsx` exports the React `ScrollArea` recipe.
- `solid.tsx` exports the Solid `ScrollArea` recipe.

The recipe applies theme borders and colors to the native terminal scrollbox,
providing smooth scrolling viewports with keyboard and mouse wheel support.
