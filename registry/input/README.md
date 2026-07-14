# Input Recipe

These files are the consumer-owned presentation layer of Input.
The root `registry.json` exposes separate `core/input`, `react/input`, and
`solid/input` items. Installation copies the selected editable recipe to
`components/ui/input.ts` or `components/ui/input.tsx`; editing behavior remains
in OpenTUI and the versioned primitive packages.

- `core.ts` is the imperative recipe.
- `react.tsx` is the React recipe.
- `solid.tsx` is the Solid recipe.

## Native Value And Events

`value` uses OpenTUI's native contract. It initializes the buffer, and later
programmatic assignments mutate the same buffer immediately. User edits also
mutate that buffer directly; there is no browser-style controlled rollback or
separate `defaultValue` ownership mode.

- `onInput` runs after each buffer mutation, including a changed programmatic
  `value` assignment.
- `onChange` runs when a changed value is committed by blur or submit.
- `onSubmit` runs after a successful Enter submission. For a changed value,
  `onChange` runs before `onSubmit`.

## Primitive And Recipe Boundary

OpenTUI owns the editing buffer, cursor, selection, paste, undo/redo, length
constraints, and input/change/submit event order. The packaged primitive
preserves that behavior and adds disabled focus, keyboard, and submit gating.
The installed recipe owns colors and other opinionated presentation.

From the workspace root, `pnpm validate:registry` builds every registry item,
installs each into a clean isolated consumer, compares installed source and
dependencies, compiles it, and runs its runtime smoke.
