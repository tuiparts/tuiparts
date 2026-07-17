/** @jsxImportSource @opentui/solid */

import { Toggle as TogglePrimitive } from "@tuiparts/solid/toggle";
import { splitProps } from "solid-js";

/** Props for the consumer-owned Solid Toggle recipe. */
export interface ToggleProps extends Omit<TogglePrimitive.Props, "children"> {
  label: string;
}

/** Consumer-owned Solid Toggle recipe. */
export function Toggle(props: ToggleProps) {
  const [recipe, toggle] = splitProps(props, ["label"]);
  return (
    <TogglePrimitive backgroundColor="transparent" {...toggle}>
      {(state: TogglePrimitive.State) => (
        <box
          backgroundColor={
            state.pressed
              ? "#2563EB"
              : state.focused
                ? "#404040"
                : "transparent"
          }
          height={1}
          paddingX={1}
        >
          <text
            content={recipe.label}
            fg={state.disabled ? "#737373" : "#F5F5F5"}
          />
        </box>
      )}
    </TogglePrimitive>
  );
}
