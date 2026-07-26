/** @jsxImportSource @opentui/solid */

import { createCliRenderer } from "@opentui/core";
import { render } from "@opentui/solid";
import type { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { createSignal, For, onMount } from "solid-js";
import { Checkbox } from "../src/checkbox";
import { CheckboxGroup } from "../src/checkbox-group";

const items = [
  ["email", "Email notifications"],
  ["sms", "SMS notifications"],
  ["product", "Product announcements"],
] as const;

function Demo() {
  const [value, setValue] = createSignal<readonly string[]>(["email"]);
  let first: CheckboxRootRenderable | undefined;
  onMount(() => queueMicrotask(() => first?.focus()));
  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="Solid CheckboxGroup Primitive" fg="#FFFFFF" />
      <text
        content="Up/Down moves focus. Space/Enter toggles. Ctrl+C quits."
        fg="#737373"
      />
      <CheckboxGroup value={value()} onValueChange={setValue}>
        <For each={items}>
          {([itemValue, label], index) => (
            <Checkbox.Root
              ref={(checkbox) => {
                if (index() === 0) first = checkbox;
              }}
              value={itemValue}
              flexDirection="row"
              gap={1}
              height={1}
            >
              {(state: Checkbox.Root.State) => (
                <box
                  backgroundColor={state.focused ? "#262626" : "transparent"}
                  flexDirection="row"
                  gap={1}
                  paddingX={1}
                  width="100%"
                >
                  <box width={1}>
                    <Checkbox.Indicator>
                      <text content="✓" fg="#60A5FA" />
                    </Checkbox.Indicator>
                  </box>
                  <text
                    content={label}
                    fg={state.focused ? "#FFFFFF" : "#D4D4D4"}
                  />
                </box>
              )}
            </Checkbox.Root>
          )}
        </For>
      </CheckboxGroup>
      <text
        content={`Checked: ${value().join(", ") || "none"}`}
        fg="#60A5FA"
      />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
await render(() => <Demo />, renderer);
