# OpenTUI UI Foundation

OpenTUI UI has two foundation layers:

1. Versioned packages provide reusable terminal behavior.
2. Registry recipes copy editable presentation into your application.

Use a package primitive when you are building a component or design system.
Install a registry recipe when you want a useful starting component whose
layout, glyphs, colors, and convenience props you can edit.

## Choose A Runtime

Install one framework adapter and its peers:

```bash
# React
pnpm add @opentui-ui/react @opentui-ui/core \
  @opentui/core @opentui/react react

# Solid
pnpm add @opentui-ui/solid @opentui-ui/core \
  @opentui/core @opentui/solid solid-js

# Imperative Core
pnpm add @opentui-ui/core @opentui/core
```

The React and Solid packages expose the same primitive vocabulary where their
runtimes permit it. Core exposes the same behavior as Stores and Renderables.

## Compose A Primitive

Compound framework primitives use Base UI-style module namespaces. Package
exports stay clean; recipes conventionally alias them locally with a
`Primitive` suffix.

```tsx
import { Checkbox as CheckboxPrimitive } from "@opentui-ui/react/checkbox";

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
} from "@opentui-ui/core/checkbox";

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
| RadioGroup/Radio | `RadioGroup`, `Radio.Root`, `Radio.Indicator` | group value/disabled; radio checked/focused/availability | Radio `press()`; arrows, Home/End, Enter/Return/Space | matching Group, Radio, or Indicator Renderable |
| Input | `Input` | OpenTUI-owned mutable buffer | native editing; `onInput`, `onChange`, `onSubmit` | `InputRenderable` |
| Dialog | `Dialog.Root`, Trigger, Portal, Backdrop, Popup, Title, Description, Close | open | Trigger/Close `press()`; Enter/Return/Space, Escape, Tab containment | matching Dialog part Renderable |

Checkbox, Switch, RadioGroup, and Dialog support controlled and uncontrolled
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

Configure shadcn with a `components.json`, then install the item for your
runtime:

```bash
pnpm dlx shadcn@4.13.0 add <item-address>
```

The starter catalog provides `core/*`, `react/*`, and `solid/*` items for:

- Checkbox
- Switch
- Button
- RadioGroup/Radio
- Input
- Badge

The copied file belongs to your application. Its palette, density, symbols,
labels, intent variants, native OpenTUI properties, and component assembly are
starter choices rather than package APIs. Edit them directly or use them as
the basis of another registry.

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

## Dialog And Toast Companions

Three Dialog surfaces currently have distinct roles:

- `@opentui-ui/{core,react,solid}/dialog` is the foundation compound primitive.
- `registry/dialog` is a validated preview recipe, not part of the six-family
  starter catalog.
- `@opentui-ui/dialog` is the adopted companion product with manager, provider,
  theme, and async prompt/confirm/alert/choice conveniences.

`@opentui-ui/toast` is also an adopted companion product. It retains its
current notification, theme, icon, React, and Solid APIs. Neither companion is
re-exported by the foundation packages, and installing a foundation recipe
does not replace either companion.

Companion packages remain independently versioned and supported. Their internal
reconciliation is separate work and does not determine foundation versions.

## Release Gates

`pnpm validate:foundation` runs the local release-readiness sequence: lint,
typecheck, tests, build, packed-package validation, registry validation, and
Changesets status. CI runs the same gates as individually named steps.
