/** @jsxImportSource @opentui/solid */

import { createCliRenderer } from "@opentui/core";
import { render } from "@opentui/solid";
import { createSignal, For } from "solid-js";
import { Accordion } from "../src/accordion";

const items = [
  {
    content: "Most orders arrive within three business days.",
    label: "How long does shipping take?",
    value: "shipping",
  },
  {
    content: "Unused items can be returned within 30 days.",
    label: "Can I return an order?",
    value: "returns",
  },
  {
    content: "Send a message from the account screen.",
    label: "How do I contact support?",
    value: "support",
  },
] as const;

function Demo() {
  const [value, setValue] = createSignal<readonly string[]>(["shipping"]);

  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="Solid Accordion Primitive" fg="#FFFFFF" />
      <text
        content="Up/Down moves focus. Space/Enter toggles an Item. Ctrl+C quits."
        fg="#737373"
      />

      <Accordion.Root
        value={value()}
        onValueChange={setValue}
        flexDirection="column"
      >
        <For each={items}>
          {(item, index) => (
            <Accordion.Item
              value={item.value}
              flexDirection="column"
              gap={1}
            >
              <Accordion.Trigger
                ref={(trigger) => {
                  if (index() === 0) trigger?.focus();
                }}
                height={1}
                paddingX={1}
              >
                {(state: Accordion.Trigger.State) => (
                  <box
                    backgroundColor={
                      state.focused ? "#262626" : "transparent"
                    }
                  >
                    <text
                      content={`${state.open ? "⌄" : "›"} ${item.label}`}
                      fg={state.focused ? "#FFFFFF" : "#D4D4D4"}
                    />
                  </box>
                )}
              </Accordion.Trigger>
              <Accordion.Panel paddingLeft={3}>
                <text content={item.content} fg="#A3A3A3" />
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </For>
      </Accordion.Root>

      <text
        content={`Open: ${value().join(", ") || "none"}`}
        fg="#60A5FA"
      />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
await render(() => <Demo />, renderer);
