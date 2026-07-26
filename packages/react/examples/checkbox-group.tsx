/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { useCallback, useState } from "react";
import { Checkbox } from "../src/checkbox";
import { CheckboxGroup } from "../src/checkbox-group";

const items = [
  ["email", "Email notifications"],
  ["sms", "SMS notifications"],
  ["product", "Product announcements"],
] as const;

function Demo() {
  const [value, setValue] = useState<readonly string[]>(["email"]);
  const focusFirst = useCallback(
    (checkbox: CheckboxRootRenderable | null) => checkbox?.focus(),
    [],
  );
  return (
    <box flexDirection="column" gap={1} padding={2}>
      <text content="React CheckboxGroup Primitive" fg="#FFFFFF" />
      <text
        content="Up/Down moves focus. Space/Enter toggles. Ctrl+C quits."
        fg="#737373"
      />
      <CheckboxGroup value={value} onValueChange={setValue}>
        {items.map(([itemValue, label], index) => (
          <Checkbox.Root
            key={itemValue}
            ref={index === 0 ? focusFirst : undefined}
            value={itemValue}
            flexDirection="row"
            gap={1}
            height={1}
          >
            {(state) => (
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
        ))}
      </CheckboxGroup>
      <text
        content={`Checked: ${value.join(", ") || "none"}`}
        fg="#60A5FA"
      />
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");
createRoot(renderer).render(<Demo />);
