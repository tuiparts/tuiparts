# @tuiparts/core

Framework-neutral OpenTUI Primitives for tuiparts.sh.

New to the package/recipe split? Start with the
[primitive and recipe guide](https://github.com/tuiparts/tuiparts/blob/main/docs/primitives-and-recipes.md).

## Installation

Add the package to an existing OpenTUI Core application:

```bash
pnpm add @tuiparts/core
```

The package supports `@opentui/core` `^0.4.3`.

## Primitive modules

Primitive modules own terminal interaction and coordination without choosing
colors, spacing, glyphs, labels, or fixed visual trees.

| Module | Core interface | Public parts |
| --- | --- | --- |
| Button | `ButtonStore` | `ButtonRenderable` |
| Checkbox | `CheckboxStore` | `CheckboxRootRenderable`, `CheckboxIndicatorRenderable` |
| Dialog | `DialogStore` | Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close Renderables |
| Input | OpenTUI-native state | `InputRenderable` |
| Radio / RadioGroup | `RadioGroupStore` | `RadioGroupRenderable`, `RadioRootRenderable`, `RadioIndicatorRenderable` |
| Switch | `SwitchStore` | `SwitchRootRenderable`, `SwitchThumbRenderable` |
| Tabs | `TabsStore` | `TabsRootRenderable`, `TabsListRenderable`, `TabsTabRenderable`, `TabsPanelRenderable` |
| Toggle | `ToggleStore` | `ToggleRenderable` |
| ToggleGroup | `ToggleGroupStore` | `ToggleGroupRenderable` containing ordinary `ToggleRenderable` children |

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

## Recipe boundary

Behaviorless presentation such as Badge is distributed as editable registry
source rather than a Core package module. Recipes use ordinary TypeScript and
native OpenTUI properties; primitive behavior owns no styling infrastructure.

See [`PRIMITIVE_CONTRACT.md`](../../PRIMITIVE_CONTRACT.md)
and [`PRIMITIVES_AND_RECIPES.md`](../../PRIMITIVES_AND_RECIPES.md) for the
ownership and composition contract.

## License

MIT
