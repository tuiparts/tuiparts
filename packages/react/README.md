# @opentui-ui/react

React bindings for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/react @opentui-ui/core @opentui-ui/styles \
  @opentui/core @opentui/react react ws
```

Peer requirements are `@opentui/core` and `@opentui/react` `^0.4.3`, React
`>=19.2.0 <20`, and `ws` `^8.21.0`.

## Foundation Example

```tsx
import { Checkbox, Input, RadioGroup, Switch } from "@opentui-ui/react";
import { useState } from "react";

export function Settings() {
  const [checked, setChecked] = useState(false);
  return (
    <box flexDirection="column" gap={1}>
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
      <RadioGroup.Root defaultValue="stable">
        <RadioGroup.Item value="stable">
          <text content="Stable" />
        </RadioGroup.Item>
      </RadioGroup.Root>
    </box>
  );
}
```

## Imports

All components are exported from `@opentui-ui/react`. Focused imports are also
supported:

```ts
import { Badge } from "@opentui-ui/react/badge";
import { Button } from "@opentui-ui/react/button";
import { Checkbox } from "@opentui-ui/react/checkbox";
import { Input } from "@opentui-ui/react/input";
import { RadioGroup } from "@opentui-ui/react/radio";
import { Switch } from "@opentui-ui/react/switch";
import { styled } from "@opentui-ui/react/styled";
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

## Styling

Use `styled()` for reusable base styles, variants, compound variants, defaults,
state selectors, and per-instance overrides:

```tsx
const Action = styled(Button, {
  base: {
    root: {
      backgroundColor: "#262626",
      _focused: { backgroundColor: "#1D4ED8" },
      _disabled: { opacity: 0.5 },
    },
    label: { color: "#FAFAFA" },
  },
  variants: {
    tone: {
      primary: { root: { backgroundColor: "#2563EB" } },
      danger: { root: { backgroundColor: "#DC2626" } },
    },
  },
  defaultVariants: { tone: "primary" },
});

<Action tone="danger" styles={{ root: { paddingX: 3 } }} label="Delete" />;
```

Nested styled components merge configuration and render the deepest base once.
See [`@opentui-ui/styles`](../styles) for resolution order and selector details.

## License

MIT
