# @tuiparts/solid

The Solid Adapter for tuiparts.sh Primitives.

New to package primitives and editable recipes? Start with the
[primitive and recipe guide](https://github.com/tuiparts/tuiparts/blob/main/docs/primitives-and-recipes.md).

## Installation

```bash
pnpm add @tuiparts/solid @tuiparts/core \
  @opentui/core @opentui/solid solid-js
```

Peer requirements are `@opentui/core` and `@opentui/solid` `^0.4.3`, with
`solid-js` pinned to `1.9.12` for OpenTUI compatibility.

## Primitive example

```tsx
import { Button, Checkbox, Input, Radio, RadioGroup, Switch, Toggle, ToggleGroup } from "@tuiparts/solid";
import { createSignal } from "solid-js";

export function Settings() {
  const [checked, setChecked] = createSignal(false);
  return (
    <box flexDirection="column" gap={1}>
      <Button onPress={({ source }) => console.log(source)}>
        <text content="Run" />
      </Button>
      <Checkbox.Root checked={checked()} onCheckedChange={setChecked}>
        <Checkbox.Indicator>
          <text content="✓" />
        </Checkbox.Indicator>
        <text content="Run checks" />
      </Checkbox.Root>
      <Input placeholder="Release name" onSubmit={console.log} />
      <Switch.Root checked={checked()} onCheckedChange={setChecked}>
        {(state) => <text content={state.checked ? "On" : "Off"} />}
      </Switch.Root>
      <RadioGroup defaultValue="stable">
        <Radio.Root value="stable">
          <text content="Stable" />
        </Radio.Root>
      </RadioGroup>
      <Toggle defaultPressed>
        {(state) => <text content={state.pressed ? "Pinned" : "Unpinned"} />}
      </Toggle>
      <ToggleGroup defaultValue={["bold"]} multiple>
        <Toggle value="bold"><text content="Bold" /></Toggle>
        <Toggle value="italic"><text content="Italic" /></Toggle>
      </ToggleGroup>
    </box>
  );
}
```

Solid props are spread reactively onto the existing Renderable. Signal changes
update controlled primitive state without remounting.

## Imports

```ts
import { Button } from "@tuiparts/solid/button";
import { Checkbox } from "@tuiparts/solid/checkbox";
import { Input } from "@tuiparts/solid/input";
import { Radio } from "@tuiparts/solid/radio";
import { RadioGroup } from "@tuiparts/solid/radio-group";
import { Switch } from "@tuiparts/solid/switch";
import { Dialog } from "@tuiparts/solid/dialog";
import { Toggle } from "@tuiparts/solid/toggle";
import { ToggleGroup } from "@tuiparts/solid/toggle-group";
```

All Primitives are also exported from `@tuiparts/solid`.

## Dialog

`Dialog` is the Solid compound adapter for the packaged Dialog
behavior in `@tuiparts/core/dialog`. Compose its Root, Trigger, Portal,
Backdrop, Popup, Title, Description, and Close parts, or install the editable
`solid/dialog` registry recipe for visual assembly. Its reactive props and
portal lifecycle preserve coordinator-owned visibility/z-index, focus
containment, detached restoration, and reverse Tab behavior.

The existing `@tuiparts/dialog/solid` provider, hooks, and async APIs remain
the companion convenience surface; they are not re-exported by the Solid
adapter.

## Input

`Input` is an additive, unstyled adapter that preserves OpenTUI's
mutable value and event model. It has no `defaultValue`, controlled rollback,
or callback aliases.

```tsx
import { Input } from "@tuiparts/solid/input";

<Input
  value="initial"
  onInput={console.log}
  onChange={commit}
  onSubmit={submit}
/>;
```

`onInput` reports mutations, `onChange` reports commits on blur or submit, and
`onSubmit` reports Enter after any changed-value `onChange`. Visual defaults
belong in editable recipes. This is the canonical primitive contract.

## Recipes

Behaviorless presentation such as Badge is installed from the registry rather
than imported from this package. Consumer-owned recipes use ordinary TypeScript
and native OpenTUI properties.

## License

MIT
