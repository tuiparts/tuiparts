# @opentui-ui/solid

Solid bindings for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/solid @opentui-ui/core \
  @opentui/core @opentui/solid solid-js
```

Peer requirements are `@opentui/core` and `@opentui/solid` `^0.4.3`, with
`solid-js` pinned to `1.9.12` for OpenTUI compatibility.

## Foundation Example

```tsx
import { Button, Checkbox, Input, Radio, RadioGroup, Switch } from "@opentui-ui/solid";
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
    </box>
  );
}
```

Solid props are spread reactively onto the existing Renderable. Signal changes
update controlled primitive state without remounting.

## Imports

```ts
import { Button } from "@opentui-ui/solid/button";
import { Checkbox } from "@opentui-ui/solid/checkbox";
import { Input } from "@opentui-ui/solid/input";
import { Radio } from "@opentui-ui/solid/radio";
import { RadioGroup } from "@opentui-ui/solid/radio-group";
import { Switch } from "@opentui-ui/solid/switch";
import { Dialog } from "@opentui-ui/solid/dialog";
```

All components are also exported from `@opentui-ui/solid`.

## Dialog

`Dialog` is the Solid compound adapter for the foundation Dialog
behavior in `@opentui-ui/core/dialog`. Compose its Root, Trigger, Portal,
Backdrop, Popup, Title, Description, and Close parts, or install the editable
`solid/dialog` registry recipe for visual assembly. Its reactive props and
portal lifecycle preserve coordinator-owned visibility/z-index, focus
containment, detached restoration, and reverse Tab behavior.

The existing `@opentui-ui/dialog/solid` provider, hooks, and async APIs remain
the production convenience surface; they are not re-exported from this tracer.

## Input

`Input` is an additive, unstyled adapter that preserves OpenTUI's
mutable value and event model. It has no `defaultValue`, controlled rollback,
or callback aliases.

```tsx
import { Input } from "@opentui-ui/solid/input";

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
than imported from this package. Consumer-owned recipes may use ordinary
OpenTUI props or the optional [`@opentui-ui/styles`](../styles) infrastructure.

## License

MIT
