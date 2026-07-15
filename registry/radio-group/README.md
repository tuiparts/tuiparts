# Radio Group Recipe

These files are the consumer-owned presentation layer for Radio and
RadioGroup. The root `registry.json` exposes separate `core/radio-group`,
`react/radio-group`, and `solid/radio-group` items. Installation copies the
selected editable recipe to `components/ui/radio-group.ts` or
`components/ui/radio-group.tsx`; collection behavior remains versioned in the
primitive packages.

- `core.ts` is the imperative recipe.
- `react.tsx` is the React recipe.
- `solid.tsx` is the Solid recipe.

## Primitive Shape

The framework recipe follows the Base UI module split:

```tsx
import { Radio as RadioPrimitive } from "@tuiparts/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@tuiparts/react/radio-group";

<RadioGroupPrimitive defaultValue="alpha">
  <RadioPrimitive.Root value="alpha">
    <RadioPrimitive.Indicator />
  </RadioPrimitive.Root>
</RadioGroupPrimitive>;
```

`Radio.Root` always requires RadioGroup ownership. Core callers pass the
matching `RadioGroupStore` and place `RadioRootRenderable` beneath the
associated `RadioGroupRenderable`. React and Solid provide that owner through
private context and fail clearly when it is missing.

A one-choice UI uses the same composition with one Radio. There is no hidden
wrapper or boolean `selected` state. Checkbox or Switch is the appropriate
control when activation should toggle a boolean off again.

## Keyboard Contract

- Left and Up move focus to the previous available Radio; Right and Down move
  to the next. Navigation wraps and requests the focused value.
- Home moves to the first available Radio and End moves to the last; both
  request that value.
- Space, Enter, and Return activate the focused Radio.
- Disabled or unavailable Radios are skipped and do not activate.

## State Ownership

With `defaultValue`, RadioGroup owns uncontrolled selection. With `value`, the
parent owns controlled selection: `onValueChange` reports intent, but only a
new parent-provided value changes which Radio is checked. Keyboard focus can
still move immediately in controlled mode.

RadioGroup maintains one available tab stop. Disabling, hiding, removing, or
otherwise making the focused Radio unavailable moves focus to an available
fallback. Dynamic Radios register in render order and unregister without stale
focus or uncontrolled selection. Group-level disabled state prevents Radio
focus and activation.

## Primitive And Recipe Boundary

The packaged primitive owns collection registration, readonly RadioGroup and
Radio state, controlled/uncontrolled coordination, selection intent, keyboard
and pointer activation, roving focus, disabled behavior, and lifecycle. The
installed recipe owns labels, marks, layout, spacing, colors, and other
presentation.

ADR 0002 records the ownership and naming decision.

From the workspace root, `pnpm validate:registry` builds every registry item,
installs it into an isolated consumer, checks source/dependencies, compiles it,
and runs its runtime smoke.
