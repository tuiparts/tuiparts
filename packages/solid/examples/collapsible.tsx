/** @jsxImportSource @opentui/solid */

import { createCliRenderer } from "@opentui/core";
import { render } from "@opentui/solid";
import { createSignal, onMount } from "solid-js";
import { Collapsible } from "../src/collapsible";

function Demo() {
  const [open, setOpen] = createSignal(false);
  const [source, setSource] = createSignal("ready");
  let trigger: { focus(): void } | undefined;

  onMount(() => trigger?.focus());

  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="Solid Collapsible Primitive" fg="#FFFFFF" />
      <text
        content="Space/Enter toggles the focused Trigger. Ctrl+C quits."
        fg="#737373"
      />

      <Collapsible.Root
        open={open()}
        onOpenChange={(nextOpen, details) => {
          setOpen(nextOpen);
          setSource(details.source);
        }}
        flexDirection="column"
        gap={1}
      >
        <Collapsible.Trigger
          ref={(value) => {
            trigger = value;
          }}
          height={1}
          paddingX={1}
        >
          {(state: Collapsible.Trigger.State) => (
            <box backgroundColor={state.focused ? "#262626" : "transparent"}>
              <text
                content={`${state.open ? "⌄" : "›"} Connection details`}
                fg={state.focused ? "#FFFFFF" : "#D4D4D4"}
              />
            </box>
          )}
        </Collapsible.Trigger>
        <Collapsible.Panel flexDirection="column" paddingLeft={3}>
          <text content="Region: eu-west" fg="#A3A3A3" />
          <text content="Transport: ssh" fg="#A3A3A3" />
        </Collapsible.Panel>
      </Collapsible.Root>

      <text
        content={`State: ${open() ? "open" : "closed"} (${source()})`}
        fg="#60A5FA"
      />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
await render(() => <Demo />, renderer);
