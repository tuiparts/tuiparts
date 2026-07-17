/** @jsxImportSource @opentui/react */

import { Toggle as TogglePrimitive } from "@tuiparts/react/toggle";

/** Props for the consumer-owned React Toggle recipe. */
export interface ToggleProps extends Omit<TogglePrimitive.Props, "children"> {
  label: string;
}

/** Consumer-owned React Toggle recipe. */
export function Toggle({ label, ...props }: ToggleProps) {
  return (
    <TogglePrimitive backgroundColor="transparent" {...props}>
      {(state) => (
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
          <text content={label} fg={state.disabled ? "#737373" : "#F5F5F5"} />
        </box>
      )}
    </TogglePrimitive>
  );
}
