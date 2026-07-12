# @opentui-ui/solid

Solid bindings for the OpenTUI UI foundation.

## Installation

```bash
pnpm add @opentui-ui/solid @opentui-ui/core @opentui-ui/styles \
  @opentui/core @opentui/solid solid-js
```

Peer requirements are `@opentui/core` and `@opentui/solid` `^0.4.3`, with
`solid-js` pinned to `1.9.12` for OpenTUI compatibility.

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
} from "@opentui-ui/solid";
import { createSignal } from "solid-js";

export function Settings() {
  const [checked, setChecked] = createSignal(false);
  const [channel, setChannel] = createSignal("stable");

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
      <Checkbox label="Run checks" checked={checked()} onCheckedChange={setChecked} />
      <Input placeholder="Release name" onSubmit={console.log} />
      <Switch label="Provenance" checked={checked()} onCheckedChange={setChecked} />
      <Radio
        label="Stable"
        selected={channel() === "stable"}
        onActivate={() => setChannel("stable")}
      />
      <Radio
        label="Next"
        selected={channel() === "next"}
        onActivate={() => setChannel("next")}
      />
    </RadioGroup>
  );
}
```

Solid props are spread reactively onto the existing Renderable. Signal changes
update controlled state, labels, variants, and inline styles without remounting.

## Imports

```ts
import { Badge } from "@opentui-ui/solid/badge";
import { Button } from "@opentui-ui/solid/button";
import { Checkbox } from "@opentui-ui/solid/checkbox";
import { Input } from "@opentui-ui/solid/input";
import { Radio, RadioGroup } from "@opentui-ui/solid/radio";
import { Switch } from "@opentui-ui/solid/switch";
import { styled } from "@opentui-ui/solid/styled";
```

All components are also exported from `@opentui-ui/solid`.

## Styling

```tsx
const Choice = styled(Radio, {
  base: {
    mark: {
      color: "#737373",
      _selected: { color: "#22C55E" },
      _focused: { color: "#60A5FA" },
      _disabled: { color: "#404040" },
    },
  },
  variants: {
    size: {
      compact: { box: { gap: 0 } },
      normal: { box: { gap: 1 } },
    },
  },
  defaultVariants: { size: "normal" },
});

<Choice label="Stable" selected={true} />;
```

Nested styled components merge configuration and render the deepest base once.
See [`@opentui-ui/styles`](../styles) for the complete styling contract.

## License

MIT
