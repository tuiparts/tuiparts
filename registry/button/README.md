# Button Recipe

These files are consumer-owned Button recipes built on the packaged unstyled
Button behavior.

- `core.ts` exports the imperative `createButton` recipe.
- `react.tsx` exports the React `Button` recipe.
- `solid.tsx` exports the Solid `Button` recipe.

The packaged primitive owns activation, focus, pressed state, disabled
behavior, and source-specific press details. The editable recipes choose the
label, padding, colors, intent, and size.
