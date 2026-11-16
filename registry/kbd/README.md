# Kbd Recipe

Kbd is consumer-owned presentation, not a packaged primitive. These registry
items install editable source composed directly from OpenTUI Box and Text nodes:

- `core.ts` exports the imperative `createKbd` and `createKbdGroup` recipes.
- `react.tsx` exports the React `Kbd` and `KbdGroup` recipes.
- `solid.tsx` exports the Solid `Kbd` and `KbdGroup` recipes.

The recipes provide keyboard shortcut presentation using semantic surface and
muted foreground colors with standard padding. Native Box properties and
`labelOptions` are applied after those defaults, allowing applications to customize
appearance or edit the source directly.
