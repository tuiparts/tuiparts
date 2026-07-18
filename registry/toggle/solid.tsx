/** @jsxImportSource @opentui/solid */

import { Toggle as TogglePrimitive } from "@tuiparts/solid/toggle";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Toggle recipe. */
export interface ToggleProps extends Omit<TogglePrimitive.Props, "children"> {
  label: string;
}

/** Consumer-owned Solid Toggle recipe. */
export function Toggle(props: ToggleProps) {
  const [recipe, toggle] = splitProps(props, ["label"]);
  const tokens = useTheme();
  return (
    <TogglePrimitive backgroundColor="transparent" {...toggle}>
      {(state: TogglePrimitive.State) => (
        <box
          backgroundColor={
            state.pressed
              ? tokens().colors.primary
              : state.focused
                ? tokens().colors.surface
                : "transparent"
          }
          height={1}
          paddingX={tokens().density.paddingX}
        >
          <text
            content={recipe.label}
            fg={
              state.disabled
                ? tokens().colors.disabledForeground
                : state.pressed
                  ? tokens().colors.primaryForeground
                  : tokens().colors.foreground
            }
          />
        </box>
      )}
    </TogglePrimitive>
  );
}
