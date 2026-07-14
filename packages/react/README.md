# @opentui-ui/react

React bindings for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/react @opentui-ui/core \
  @opentui/core @opentui/react react ws
```

Peer requirements are `@opentui/core` and `@opentui/react` `^0.4.3`, React
`>=19.2.0 <20`, and `ws` `^8.21.0`.

## Foundation Example

```tsx
import { Button, Checkbox, Input, Radio, RadioGroup, Switch } from "@opentui-ui/react";
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
    </box>
  );
}
```

## Imports

All components are exported from `@opentui-ui/react`. Focused imports are also
supported:

```ts
import { Button } from "@opentui-ui/react/button";
import { Checkbox } from "@opentui-ui/react/checkbox";
import { Input } from "@opentui-ui/react/input";
import { Radio } from "@opentui-ui/react/radio";
import { RadioGroup } from "@opentui-ui/react/radio-group";
import { Switch } from "@opentui-ui/react/switch";
import { Dialog } from "@opentui-ui/react/dialog";
```

## Dialog

`Dialog` is the React compound adapter for the foundation Dialog
behavior in `@opentui-ui/core/dialog`. Compose its Root, Trigger, Portal,
Backdrop, Popup, Title, Description, and Close parts, or install the editable
`react/dialog` registry recipe for an opinionated visual assembly. The adapter
preserves coordinator-owned visibility and z-index plus portal, focus, and
controlled-state lifecycle behavior.

The existing `@opentui-ui/dialog/react` provider, hooks, and async APIs remain
the production convenience surface; they are not re-exported from this tracer.

## Input

`Input` is an additive, unstyled adapter that preserves OpenTUI's
mutable value and event model. It has no `defaultValue`, controlled rollback,
or callback aliases.

```tsx
import { Input } from "@opentui-ui/react/input";

<Input
  value="initial"
  onInput={console.log}
  onChange={commit}
  onSubmit={submit}
/>;
```

`onInput` reports mutations, `onChange` reports commits on blur or submit, and
`onSubmit` reports Enter after any changed-value `onChange`. Visual defaults
belong in editable recipes. This is the canonical foundation contract.

## Recipes

Behaviorless presentation such as Badge is installed from the registry rather
than imported from this package. Consumer-owned recipes use ordinary TypeScript
and native OpenTUI properties.

## License

MIT
