/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { AccordionTriggerRenderable } from "@tuiparts/core/accordion";
import { useCallback, useState } from "react";
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
  const [value, setValue] = useState<readonly string[]>(["shipping"]);
  const focusFirst = useCallback(
    (trigger: AccordionTriggerRenderable | null) => trigger?.focus(),
    [],
  );

  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="React Accordion Primitive" fg="#FFFFFF" />
      <text
        content="Up/Down moves focus. Space/Enter toggles an Item. Ctrl+C quits."
        fg="#737373"
      />

      <Accordion.Root
        value={value}
        onValueChange={setValue}
        flexDirection="column"
      >
        {items.map((item, index) => (
          <Accordion.Item
            key={item.value}
            value={item.value}
            flexDirection="column"
            gap={1}
          >
            <Accordion.Trigger
              ref={index === 0 ? focusFirst : undefined}
              height={1}
              paddingX={1}
            >
              {(state) => (
                <box
                  backgroundColor={state.focused ? "#262626" : "transparent"}
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
        ))}
      </Accordion.Root>

      <text content={`Open: ${value.join(", ") || "none"}`} fg="#60A5FA" />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
createRoot(renderer).render(<Demo />);
