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
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Radio,
  RadioGroup,
  Switch,
} from "@opentui-ui/react";
import { useState } from "react";

export function Settings() {
  const [checked, setChecked] = useState(false);
  const [channel, setChannel] = useState("stable");

  return (
    <RadioGroup flexDirection="column" gap={1}>
      <Badge
        label="v1"
        styles={{
          root: { backgroundColor: "#14532D", paddingX: 1 },
          label: { color: "#DCFCE7" },
        }}
      />
      <Button label="Deploy" onPress={() => console.log("deploy")} />
      <Checkbox label="Run checks" checked={checked} onCheckedChange={setChecked} />
      <Input placeholder="Release name" onSubmit={console.log} />
      <Switch label="Provenance" checked={checked} onCheckedChange={setChecked} />
      <Radio
        label="Stable"
        selected={channel === "stable"}
        onActivate={() => setChannel("stable")}
      />
      <Radio
        label="Next"
        selected={channel === "next"}
        onActivate={() => setChannel("next")}
      />
    </RadioGroup>
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
import { Radio, RadioGroup } from "@opentui-ui/react/radio";
import { Switch } from "@opentui-ui/react/switch";
import { styled } from "@opentui-ui/react/styled";
```

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
