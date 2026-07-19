# @tuiparts/react

The React Adapter for tuiparts.sh Primitives.

New to package primitives and editable recipes? Start with the
[primitive and recipe guide](https://github.com/tuiparts/tuiparts/blob/main/docs/primitives-and-recipes.md).

## Installation

```bash
pnpm add @tuiparts/react @tuiparts/core \
  @opentui/core @opentui/react react
```

Peer requirements are `@opentui/core` and `@opentui/react` `^0.4.3`, React
`>=19.2.0 <20`.

## Primitive example

```tsx
import { Button, Checkbox, Input, Radio, RadioGroup, Switch, Toggle, ToggleGroup } from "@tuiparts/react";
import { useState } from "react";

export function Settings() {
  const [checked, setChecked] = useState(false);
  return (
    <box flexDirection="column" gap={1}>
      <Button onPress={({ source }) => console.log(source)}>
        <text content="Run" />
      </Button>
      <Checkbox.Root checked={checked} onCheckedChange={setChecked}>
        <Checkbox.Indicator>
          <text content="✓" />
        </Checkbox.Indicator>
        <text content="Run checks" />
      </Checkbox.Root>
      <Input placeholder="Release name" onSubmit={console.log} />
      <Switch.Root checked={checked} onCheckedChange={setChecked}>
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

## Imports

All Primitives are exported from `@tuiparts/react`. Focused imports are also
supported:

```ts
import { Button } from "@tuiparts/react/button";
import { Checkbox } from "@tuiparts/react/checkbox";
import { Input } from "@tuiparts/react/input";
import { Radio } from "@tuiparts/react/radio";
import { RadioGroup } from "@tuiparts/react/radio-group";
import { Switch } from "@tuiparts/react/switch";
import { Dialog } from "@tuiparts/react/dialog";
import { Toggle } from "@tuiparts/react/toggle";
import { ToggleGroup } from "@tuiparts/react/toggle-group";
```

## Dialog

`Dialog` is the React compound adapter for the packaged Dialog
behavior in `@tuiparts/core/dialog`. Compose its Root, Trigger, Portal,
Backdrop, Popup, Title, Description, and Close parts, or install the editable
`react/dialog` registry recipe for an opinionated visual assembly. The adapter
preserves coordinator-owned visibility and z-index plus portal, focus, and
controlled-state lifecycle behavior.

The existing `@tuiparts/dialog/react` provider, hooks, and async APIs remain
the companion convenience surface; they are not re-exported by the React
adapter.

## Input

`Input` is an additive, unstyled adapter that preserves OpenTUI's
mutable value and event model. It has no `defaultValue`, controlled rollback,
or callback aliases.

```tsx
import { Input } from "@tuiparts/react/input";

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
