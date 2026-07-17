/** @jsxImportSource @opentui/solid */

import { Toggle as TogglePrimitive } from "@tuiparts/solid/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@tuiparts/solid/toggle-group";
import { splitProps } from "solid-js";

/** Props for the consumer-owned Solid ToggleGroup layout. */
export type ToggleGroupProps = ToggleGroupPrimitive.Props;

/** Props for one consumer-owned Solid ToggleGroup item. */
export interface ToggleGroupItemProps
  extends Omit<TogglePrimitive.Props, "children" | "value"> {
  label: string;
  value: string;
}

/** Consumer-owned Solid ToggleGroup layout. */
export function ToggleGroup(props: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      flexDirection={props.orientation === "vertical" ? "column" : "row"}
      gap={1}
      {...props}
    />
  );
}

/** Consumer-owned Solid ToggleGroup item presentation. */
export function ToggleGroupItem(props: ToggleGroupItemProps) {
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
