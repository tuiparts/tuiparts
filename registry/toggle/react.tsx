/** @jsxImportSource @opentui/react */

import { Toggle as TogglePrimitive } from "@tuiparts/react/toggle";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Toggle recipe. */
export interface ToggleProps extends Omit<TogglePrimitive.Props, "children"> {
  label: string;
}

/** Consumer-owned React Toggle recipe. */
export function Toggle({ label, ...props }: ToggleProps) {
  const tokens = useTheme();
  return (
    <TogglePrimitive backgroundColor="transparent" {...props}>
      {(state) => (
        <box
          backgroundColor={
            state.pressed
              ? tokens.colors.primary
              : state.focused
                ? tokens.colors.surface
                : "transparent"
          }
          height={1}
          paddingX={tokens.density.paddingX}
        >
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : state.pressed
                  ? tokens.colors.primaryForeground
                  : tokens.colors.foreground
            }
          />
        </box>
      )}
    </TogglePrimitive>
  );
}
