# Separator Recipe

Separator is consumer-owned presentation, not a packaged primitive. These
registry items install editable source composed directly from an OpenTUI Box
node:

- `core.ts` exports the imperative `createSeparator` recipe.
- `react.tsx` exports the React `Separator` recipe.
- `solid.tsx` exports the Solid `Separator` recipe.

The recipes provide clean horizontal and vertical line dividers using OpenTUI's
single-side borders (`["top"]` or `["left"]`) matching the active theme's
border token. Applications can override orientation, dimensions, border style,
or color directly via props.
