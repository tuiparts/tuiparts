# Primitives and recipes

tuiparts.sh has two architecture layers:

1. Versioned packages provide reusable terminal behavior.
2. Registry recipes copy editable presentation into your application.

Use a packaged Primitive when you are building a custom control or design
system. Install a Registry Recipe when you want useful starting source whose
layout, glyphs, colors, and convenience props you can edit.

## Choose a runtime

Add one package to an existing OpenTUI application with the corresponding
runtime already installed:

```bash
# React
pnpm add @tuiparts/react

# Solid
pnpm add @tuiparts/solid

# Imperative Core
pnpm add @tuiparts/core
```

The React and Solid packages expose the same primitive vocabulary where their
runtimes permit it. Core exposes the same behavior as Stores and Renderables.

Not every Catalog Recipe needs one of these packages. When OpenTUI already
owns the complete behavior and its React and Solid adapters expose the needed
props, events, reactive updates, and actual Renderable refs, Recipes consume
OpenTUI directly. The Foundation does not wrap a native Renderable only to
rename or restyle it.

## Compose a primitive

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

## Primitive reference

| Primitive | Framework shape | Readonly state | Actions and keys | Ref target |
| --- | --- | --- | --- | --- |
| Button | `Button` | disabled, focused, pressed | `press()`; Enter/Return, Space, primary pointer | `ButtonRenderable` |
| Checkbox | `Checkbox.Root`, `Checkbox.Indicator` | checked, disabled, focused | `press()`; Enter/Return, Space, primary pointer | matching Root or Indicator Renderable |
| Switch | `Switch.Root`, `Switch.Thumb` | checked, disabled, focused | `press()`; Enter/Return, Space, primary pointer | matching Root or Thumb Renderable |
| Tabs | `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel` | value, activation mode, orientation; Tab/Panel local state | arrows and Home/End move focus; Tab activation selects | matching Part Renderable |
| Toggle | `Toggle` | pressed, disabled, focused | `press()`; Enter/Return, Space, primary pointer | `ToggleRenderable` |
| ToggleGroup | `ToggleGroup` containing `Toggle` | value, disabled, multiple, orientation | arrows and Home/End move focus; Toggle activation changes value | matching Group or Toggle Renderable |
| RadioGroup/Radio | `RadioGroup`, `Radio.Root`, `Radio.Indicator` | group value/disabled; radio checked/focused/availability | Radio `press()`; arrows, Home/End, Enter/Return/Space | matching Group, Radio, or Indicator Renderable |
| Input | `Input` | OpenTUI-owned mutable buffer | native editing; `onInput`, `onChange`, `onSubmit` | `InputRenderable` |
| Textarea | `Textarea` | OpenTUI-owned `EditBuffer` | native multiline editing; content, cursor, submit callbacks | `TextareaRenderable` |
| Dialog | `Dialog.Root`, Trigger, Portal, Backdrop, Popup, Title, Description, Close | open | Trigger/Close `press()`; Enter/Return/Space, Escape, Tab containment | matching Dialog part Renderable |

Checkbox, Switch, Toggle, ToggleGroup, Tabs, RadioGroup, and Dialog support controlled and uncontrolled
ownership. RadioGroup owns one collection value and every Radio must belong to
a group.
Input and Textarea deliberately preserve OpenTUI's native mutable editing
owners and event order instead of inventing browser-style controlled rollback.

Disabled controls reject focus and activation. Radio navigation skips
unavailable items. Dialog coordinates renderer-scoped layers, topmost
dismissal, focus containment, and restoration.

The complete ownership, event, part, lifecycle, and conformance rules are in
[`PRIMITIVE_CONTRACT.md`](../PRIMITIVE_CONTRACT.md).

## Install a recipe

Install the universal Registry item for your runtime by its `@tuiparts`
address. The shadcn Registry Directory resolves the namespace, and the item
uses explicit targets so no `components.json` or framework initialization is
required. A direct item URL works as a fallback:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

The starter catalog provides `core/*`, `react/*`, and `solid/*` items for:

- Checkbox
- Switch
- Button
- RadioGroup/Radio
- Input
- Textarea
- Dialog
- Badge
- Toggle
- ToggleGroup
- Tabs
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
source integrations. Ordinary `add` preserves local files, while `--overwrite`
deliberately discards local changes. See the
[`registry` catalog](../registry/README.md) for the complete lifecycle and the
current shadcn inspection limitation.

## Release gates

`pnpm validate:foundation` runs the local release-readiness sequence: lint,
typecheck, tests, build, packed-package validation, registry validation, and
Changesets status. CI runs the same gates as individually named steps.
