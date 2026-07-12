# @opentui-ui/core

Framework-agnostic OpenTUI Renderables for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/core @opentui/core
```

The package supports `@opentui/core` `^0.4.3`.

## Components

Every component accepts OpenTUI layout options, static `styles`, or a
`styleResolver(state)`. Components are available from the root and focused
subpaths.

| Component | Subpath | Slots | State |
| --- | --- | --- | --- |
| `BadgeRenderable` | `@opentui-ui/core/badge` | `root`, `label` | none |
| `ButtonRenderable` | `@opentui-ui/core/button` | `root`, `label` | `focused`, `disabled`, `pressed` |
| `CheckboxRenderable` | `@opentui-ui/core/checkbox` | `box`, `mark`, `label` | `checked`, `focused`, `disabled` |
| `InputRenderable` | `@opentui-ui/core/input` | `root` | `focused`, `disabled` |
| `SwitchRenderable` | `@opentui-ui/core/switch` | `track`, `thumb`, `label` | `checked`, `focused`, `disabled` |
| `RadioRenderable` | `@opentui-ui/core/radio` | `box`, `mark`, `label` | `selected`, `focused`, `disabled` |
| `RadioGroupRenderable` | `@opentui-ui/core/radio` | `root` | none |

## Dialog Primitive Tracer

`@opentui-ui/core/dialog` exports unstyled Dialog behavior: `DialogStore` and
composable Root, Trigger, Portal, Backdrop, Popup, Title, Description, and
Close renderables. It owns controlled/uncontrolled state, topmost Escape and
backdrop dismissal, focus containment/restoration, nesting, stacking, and
layer cleanup. Use a copied `core/dialog` registry recipe for presentation;
the recipe owns backdrop styling, popup layout, text treatment, and glyphs.

The production `@opentui-ui/dialog` manager and async convenience APIs remain
separate compatibility APIs and are unchanged by this tracer migration.

## Usage

```ts
import {
  BadgeRenderable,
  ButtonRenderable,
  CheckboxRenderable,
  InputRenderable,
  RadioGroupRenderable,
  RadioRenderable,
  SwitchRenderable,
} from "@opentui-ui/core";

const badge = new BadgeRenderable(ctx, {
  label: "Stable",
  styles: {
    root: { backgroundColor: "#14532D", paddingX: 1 },
    label: { color: "#DCFCE7" },
  },
});

const button = new ButtonRenderable(ctx, {
  label: "Deploy",
  onPress: deploy,
});

const checkbox = new CheckboxRenderable(ctx, {
  label: "Run checks",
  defaultChecked: true,
  onCheckedChange: console.log,
});

const input = new InputRenderable(ctx, {
  placeholder: "Release name",
  onChange: console.log,
  onSubmit: submit,
});

const toggle = new SwitchRenderable(ctx, {
  label: "Provenance",
  defaultChecked: true,
  onCheckedChange: console.log,
});

let selected = "stable";
const group = new RadioGroupRenderable(ctx, {
  flexDirection: "column",
  gap: 1,
});
const stable = new RadioRenderable(ctx, {
  label: "Stable",
  selected: selected === "stable",
  onActivate: () => {
    selected = "stable";
  },
});
group.add(stable);
```

Add Renderables to an OpenTUI parent with `parent.add(component)`.

## State Ownership

- Checkbox and Switch support either `defaultChecked` or controlled `checked`.
- Controlled callbacks report the requested next value; the application must
  pass that value back through `checked`.
- Radio is always externally selected. `onActivate` does not mutate
  `selected`.
- RadioGroup is layout-only and does not coordinate its children.
- Disabled interactive components suppress keyboard, mouse, and programmatic
  activation.

## Input Primitive Tracer

`InputPrimitiveRenderable` is the additive, unstyled Input primitive under
evaluation. It preserves OpenTUI's mutable `value` contract instead of adding
browser-style controlled ownership or `defaultValue`.

```ts
import { InputPrimitiveRenderable } from "@opentui-ui/core/input";

const input = new InputPrimitiveRenderable(ctx, {
  value: "initial",
  onInput: console.log,
  onChange: commit,
  onSubmit: submit,
});
```

`onInput` reports buffer mutations, including changed programmatic `value`
assignments. `onChange` reports a changed blur or submit commit. `onSubmit`
reports successful Enter submission, after `onChange` when both fire. Visual
defaults belong in editable recipes. This tracer contract is not frozen.

## Styling Surface

Slots backed by Box and Text primitives accept their corresponding OpenTUI
styleable options. OpenTUI's text `fg` and `bg` names are normalized to `color`
and `backgroundColor` on every public text-backed slot.

Component metadata such as `CHECKBOX_META` is exported for adapter and
`styled()` integration. Component authors should extend an OpenTUI primitive
with `withStyles()`, compose child primitives, and apply resolved slot props
with `applySlotProps()`.

## Exports

```ts
import { BadgeRenderable, withStyles } from "@opentui-ui/core";
import { ButtonRenderable } from "@opentui-ui/core/button";
import { CheckboxRenderable } from "@opentui-ui/core/checkbox";
import { InputRenderable } from "@opentui-ui/core/input";
import { RadioRenderable, RadioGroupRenderable } from "@opentui-ui/core/radio";
import { SwitchRenderable } from "@opentui-ui/core/switch";
```

## License

MIT
