# Radio Group Recipe Tracer

These files are the consumer-owned presentation layer of the Radio Group
tracer. The root `registry.json` exposes separate `core/radio-group`,
`react/radio-group`, and `solid/radio-group` items. Installation copies the
selected editable recipe to `components/ui/radio-group.ts` or
`components/ui/radio-group.tsx`; collection behavior remains in the versioned
primitive packages.

- `core.ts` is the imperative recipe.
- `react.tsx` is the React recipe.
- `solid.tsx` is the Solid recipe.

## Keyboard Contract

- Left and Up move focus to the previous available Item; Right and Down move
  focus to the next available Item. Navigation wraps and requests selection of
  the focused value.
- Home moves focus to the first available Item and End moves it to the last;
  both request selection of that value.
- Space, Enter, and Return activate the focused Item and request its selection.
- Disabled or unavailable Items are skipped and do not activate.

## State Ownership

With `defaultValue`, the primitive owns uncontrolled selection and updates it
after navigation or activation. With `value`, the parent owns controlled
selection: the primitive reports selection intent through `onValueChange`, but
only a new parent-provided value changes which Item is selected. Keyboard focus
can still move immediately in controlled mode.

The primitive maintains one available tab stop. Disabling, hiding, removing,
or otherwise making the focused Item unavailable moves focus to an available
fallback and excludes that Item from navigation. Dynamic Items register in
render order and unregister without leaving stale focus or uncontrolled
selection; if the selected uncontrolled Item leaves, selection is cleared.
Group-level disabled state prevents Item focus and activation.

## Primitive And Recipe Boundary

The packaged primitive owns collection registration, readonly group and Item
state, controlled/uncontrolled coordination, selection intent, keyboard and
pointer activation, roving focus, disabled behavior, and dynamic lifecycle.
The installed recipe owns labels, marks, layout, spacing, colors, and other
opinionated presentation. Consumers may edit or replace that recipe without
reimplementing the interaction contract.

Root, Item, Indicator, state, event details, refs, lifecycle, and ownership
behavior in this Radio Group tracer are evaluation evidence. **The tracer
contract is not frozen.**

From the workspace root, `pnpm validate:registry` builds all 12 Checkbox,
Radio Group, Input, and Dialog registry items, installs each into a clean isolated consumer,
compares installed source and dependencies, compiles it, and runs its runtime
smoke.
