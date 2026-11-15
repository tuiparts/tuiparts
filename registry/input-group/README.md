# InputGroup Recipe

InputGroup is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text
nodes:

- `core.ts` exports the imperative `createInputGroup`, `createInputGroupAddon`, and `createInputGroupText` recipes.
- `react.tsx` exports the React `InputGroup`, `InputGroupAddon`, and `InputGroupText` recipes.
- `solid.tsx` exports the Solid `InputGroup`, `InputGroupAddon`, and `InputGroupText` recipes.

The recipes assemble composite input containers with prefix or suffix addons, buttons,
and text labels. Applications can customize any slot or edit the source directly
without wrapping an opaque package component.
