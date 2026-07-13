# @opentui-ui/core

Framework-neutral OpenTUI behavior for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/core @opentui/core
```

The package supports `@opentui/core` `^0.4.3`.

## Foundation Modules

Foundation modules own terminal interaction and coordination without choosing
colors, spacing, glyphs, labels, or fixed visual trees.

| Module | Core interface | Public parts |
| --- | --- | --- |
| Button | — | `ButtonRenderable` |
| Checkbox | `CheckboxStore` | `CheckboxRootRenderable`, `CheckboxIndicatorRenderable` |
| Dialog | `DialogStore` | Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close Renderables |
| Input | OpenTUI-native state | `InputRenderable` |
| RadioGroup | `RadioGroupStore` | Root, Item, Indicator Renderables |
| Switch | `SwitchStore` | `SwitchRootRenderable`, `SwitchThumbRenderable` |

Core callers explicitly share a Store between compound parts. React and Solid
hide the same wiring behind compound-component context.

```ts
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
  CheckboxStore,
} from "@opentui-ui/core/checkbox";

const store = new CheckboxStore({
  defaultChecked: true,
  onCheckedChange: console.log,
});
const root = new CheckboxRootRenderable(ctx, { store });
const indicator = new CheckboxIndicatorRenderable(ctx, { store });

root.add(indicator);
parent.add(root);
```

Consumer-owned recipes assemble these parts with native OpenTUI Renderables and
choose their presentation. Installable examples live under `registry/`.

## Input

`InputRenderable` preserves OpenTUI's mutable `value` and event model instead
of adding browser-style controlled ownership or `defaultValue`.

```ts
import { InputRenderable } from "@opentui-ui/core/input";

const input = new InputRenderable(ctx, {
  value: "initial",
  onInput: console.log,
  onChange: commit,
  onSubmit: submit,
});
```

`onInput` reports buffer mutations, `onChange` reports a changed blur or submit
commit, and `onSubmit` reports successful Enter submission.

## Remaining Migration Surface

Badge and standalone Radio still expose the earlier packaged component model
while their recipe or foundation replacements are completed. The styling engine
remains optional recipe infrastructure and is not imported by foundation
behavior.

See [`FOUNDATION_PRIMITIVE_CONTRACT.md`](../../FOUNDATION_PRIMITIVE_CONTRACT.md)
and [`PRIMITIVES_AND_RECIPES.md`](../../PRIMITIVES_AND_RECIPES.md) for the
ownership and composition contract.

## License

MIT
