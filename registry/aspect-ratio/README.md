# AspectRatio Recipe

AspectRatio is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box nodes:

- `core.ts` exports the imperative `createAspectRatio` recipe.
- `react.tsx` exports the React `AspectRatio` recipe.
- `solid.tsx` exports the Solid `AspectRatio` recipe.

The recipe applies Yoga aspect ratio constraints (`ratio`, default `16 / 9`) to its
contained children, preserving consistent proportions in terminal layouts.
