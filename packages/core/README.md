# @tuiparts/core

Framework-neutral OpenTUI behavior for the tuiparts.sh Foundation.

New to the package/recipe split? Start with the
[foundation guide](https://github.com/tuiparts/tuiparts/blob/main/docs/foundation.md).

## Installation

```bash
pnpm add @tuiparts/core @opentui/core
```

The package supports `@opentui/core` `^0.4.3`.

## Foundation Modules

Foundation modules own terminal interaction and coordination without choosing
colors, spacing, glyphs, labels, or fixed visual trees.

| Module | Core interface | Public parts |
| --- | --- | --- |
| Button | `ButtonStore` | `ButtonRenderable` |
| Checkbox | `CheckboxStore` | `CheckboxRootRenderable`, `CheckboxIndicatorRenderable` |
| Dialog | `DialogStore` | Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close Renderables |
| Input | OpenTUI-native state | `InputRenderable` |
| Radio / RadioGroup | `RadioGroupStore` | `RadioGroupRenderable`, `RadioRootRenderable`, `RadioIndicatorRenderable` |
| Switch | `SwitchStore` | `SwitchRootRenderable`, `SwitchThumbRenderable` |

Core callers pass the owning Store between compound parts. React and Solid hide
the same wiring behind compound-component context.

```ts
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
} from "@tuiparts/core/checkbox";

const root = new CheckboxRootRenderable(ctx, {
  defaultChecked: true,
  onCheckedChange: console.log,
});
const indicator = new CheckboxIndicatorRenderable(ctx, { store: root.store });

root.add(indicator);
parent.add(root);
```

Consumer-owned recipes assemble these parts with native OpenTUI Renderables and
choose their presentation. Installable examples live under `registry/`.

## Input

`InputRenderable` preserves OpenTUI's mutable `value` and event model instead
of adding browser-style controlled ownership or `defaultValue`.

```ts
import { InputRenderable } from "@tuiparts/core/input";

const input = new InputRenderable(ctx, {
  value: "initial",
  onInput: console.log,
  onChange: commit,
  onSubmit: submit,
});
```

`onInput` reports buffer mutations, `onChange` reports a changed blur or submit
commit, and `onSubmit` reports successful Enter submission.

## Recipe Boundary

Behaviorless presentation such as Badge is distributed as editable registry
source rather than a Core package module. Recipes use ordinary TypeScript and
native OpenTUI properties; foundation behavior owns no styling infrastructure.

See [`FOUNDATION_PRIMITIVE_CONTRACT.md`](../../FOUNDATION_PRIMITIVE_CONTRACT.md)
and [`PRIMITIVES_AND_RECIPES.md`](../../PRIMITIVES_AND_RECIPES.md) for the
ownership and composition contract.

## License

MIT
