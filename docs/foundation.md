# tuiparts.sh Foundation

tuiparts.sh has two Foundation layers:

1. Versioned packages provide reusable terminal behavior.
2. Registry recipes copy editable presentation into your application.

Use a package primitive when you are building a component or design system.
Install a registry recipe when you want a useful starting component whose
layout, glyphs, colors, and convenience props you can edit.

## Choose A Runtime

Install one framework adapter and its peers:

```bash
# React
pnpm add @tuiparts/react @tuiparts/core \
  @opentui/core @opentui/react react

# Solid
pnpm add @tuiparts/solid @tuiparts/core \
  @opentui/core @opentui/solid solid-js

# Imperative Core
pnpm add @tuiparts/core @opentui/core
```

The React and Solid packages expose the same primitive vocabulary where their
runtimes permit it. Core exposes the same behavior as Stores and Renderables.

## Compose A Primitive

Compound framework primitives use Base UI-style module namespaces. Package
exports stay clean; recipes conventionally alias them locally with a
`Primitive` suffix.

```tsx
import { Checkbox as CheckboxPrimitive } from "@tuiparts/react/checkbox";

export function Checkbox() {
  return (
    <CheckboxPrimitive.Root defaultChecked flexDirection="row" gap={1}>
      {(state) => (
        <>
          <CheckboxPrimitive.Indicator>
            <text content="✓" />
          </CheckboxPrimitive.Indicator>
          <text content={state.checked ? "Enabled" : "Disabled"} />
        </>
      )}
    </CheckboxPrimitive.Root>
  );
}
```

State callbacks receive readonly primitive state. A `ref` points to the actual
Core Renderable, so imperative actions do not require a wrapper handle.
Framework consumers configure controlled props and callbacks; they do not
construct or pass Core Stores.

Core callers may use Stores directly when composing Renderables:

```ts
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
} from "@tuiparts/core/checkbox";

const root = new CheckboxRootRenderable(ctx, { defaultChecked: true });
const indicator = new CheckboxIndicatorRenderable(ctx, { store: root.store });
root.add(indicator);
```

## Primitive Reference

| Primitive | Framework shape | Readonly state | Actions and keys | Ref target |
| --- | --- | --- | --- | --- |
| Button | `Button` | disabled, focused, pressed | `press()`; Enter/Return, Space, primary pointer | `ButtonRenderable` |
| Checkbox | `Checkbox.Root`, `Checkbox.Indicator` | checked, disabled, focused | `press()`; Enter/Return, Space, primary pointer | matching Root or Indicator Renderable |
| Switch | `Switch.Root`, `Switch.Thumb` | checked, disabled, focused | `press()`; Enter/Return, Space, primary pointer | matching Root or Thumb Renderable |
| Toggle | `Toggle` | pressed, disabled, focused | `press()`; Enter/Return, Space, primary pointer | `ToggleRenderable` |
| ToggleGroup | `ToggleGroup` containing `Toggle` | value, disabled, multiple, orientation | arrows and Home/End move focus; Toggle activation changes value | matching Group or Toggle Renderable |
| RadioGroup/Radio | `RadioGroup`, `Radio.Root`, `Radio.Indicator` | group value/disabled; radio checked/focused/availability | Radio `press()`; arrows, Home/End, Enter/Return/Space | matching Group, Radio, or Indicator Renderable |
| Input | `Input` | OpenTUI-owned mutable buffer | native editing; `onInput`, `onChange`, `onSubmit` | `InputRenderable` |
| Dialog | `Dialog.Root`, Trigger, Portal, Backdrop, Popup, Title, Description, Close | open | Trigger/Close `press()`; Enter/Return/Space, Escape, Tab containment | matching Dialog part Renderable |

Checkbox, Switch, Toggle, ToggleGroup, RadioGroup, and Dialog support controlled and uncontrolled
ownership. RadioGroup owns one collection value and every Radio must belong to
a group.
Input deliberately preserves OpenTUI's native mutable value and event order
instead of inventing browser-style controlled rollback.

Disabled controls reject focus and activation. Radio navigation skips
unavailable items. Dialog coordinates renderer-scoped layers, topmost
dismissal, focus containment, and restoration.

The complete ownership, event, part, lifecycle, and conformance rules are in
[`FOUNDATION_PRIMITIVE_CONTRACT.md`](../FOUNDATION_PRIMITIVE_CONTRACT.md).

## Install A Recipe

Install the item for your runtime by its `@tuiparts` address. If the shadcn
Registry Directory does not resolve the namespace, configure its URL in
`components.json` or use the direct item URL:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

The starter catalog provides `core/*`, `react/*`, and `solid/*` items for:

- Checkbox
- Switch
- Button
- RadioGroup/Radio
- Input
- Dialog
- Badge
- Toggle
- ToggleGroup
- Theme (token contract, store, and terminal default read by every recipe)

Framework-neutral preset themes (`theme-cobalt-deep`, `theme-ascii`,
`theme-catppuccin`, `theme-gruvbox`, `theme-rosepine`) install as
`themes/<name>.ts` partial overrides of your theme file.

The copied file belongs to your application. Recipes read palette, density,
and symbol choices as tokens from the consumer-owned theme file installed
beside them (every recipe declares the theme item in `registryDependencies`);
labels, intent variants, native OpenTUI properties, and component assembly
live in each recipe. All of it is starter source rather than package API —
edit it directly or use it as the basis of another registry. There is no
packaged theme runtime; see ADR
[0006](adr/0006-theming-ships-as-registry-source.md).

Primitive package upgrades deliver behavior fixes. Recipe updates are optional
source integrations. Review upstream recipe changes without discarding local
edits:

```bash
pnpm dlx shadcn@4.13.0 add <item-address> --view
pnpm dlx shadcn@4.13.0 add <item-address> --diff
pnpm dlx shadcn@4.13.0 add <item-address> --dry-run
```

Ordinary `add` asks before replacing an existing file. Use `--overwrite` only
when you deliberately want to discard local changes. See the
[`registry` catalog](../registry/README.md) for the complete lifecycle.

## Release Gates

`pnpm validate:foundation` runs the local release-readiness sequence: lint,
typecheck, tests, build, packed-package validation, registry validation, and
Changesets status. CI runs the same gates as individually named steps.
