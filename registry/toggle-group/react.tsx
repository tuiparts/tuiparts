/** @jsxImportSource @opentui/react */

import { Toggle as TogglePrimitive } from "@tuiparts/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@tuiparts/react/toggle-group";

/** Props for the consumer-owned React ToggleGroup layout. */
export type ToggleGroupProps = ToggleGroupPrimitive.Props;

/** Props for one consumer-owned React ToggleGroup item. */
export interface ToggleGroupItemProps
  extends Omit<TogglePrimitive.Props, "children" | "value"> {
  label: string;
  value: string;
}

/** Consumer-owned React ToggleGroup layout. */
export function ToggleGroup({ orientation, ...props }: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      flexDirection={orientation === "vertical" ? "column" : "row"}
      gap={1}
      orientation={orientation}
      {...props}
    />
  );
}

/** Consumer-owned React ToggleGroup item presentation. */
export function ToggleGroupItem({ label, ...props }: ToggleGroupItemProps) {
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
