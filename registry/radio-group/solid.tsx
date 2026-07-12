/** @jsxImportSource @opentui/solid */

import {
  type RadioGroupItemState,
  RadioGroupPrimitive,
  type RadioGroupPrimitiveItemProps,
  type RadioGroupPrimitiveRootProps,
} from "@opentui-ui/solid/radio";
import { splitProps } from "solid-js";

export interface RadioGroupProps extends RadioGroupPrimitiveRootProps {}

export interface RadioGroupItemProps
  extends Omit<RadioGroupPrimitiveItemProps, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned group layout on top of packaged collection behavior. */
export function RadioGroup(props: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      flexDirection="column"
      gap={0}
      backgroundColor="transparent"
      {...props}
    />
  );
}

/** Consumer-owned Item layout, label, mark, and colors. */
export function RadioGroupItem(props: RadioGroupItemProps) {
  const [recipe, item] = splitProps(props, [
    "label",
    "mark",
    "tone",
    "disabled",
  ]);
  const markColor = () => (recipe.tone === "success" ? "#10B981" : "#3B82F6");

  return (
    <RadioGroupPrimitive.Item
      flexDirection="row"
      gap={1}
      height={1}
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...item}
    >
      {(state: RadioGroupItemState) => (
        <>
          <box width={1}>
            <RadioGroupPrimitive.Indicator>
              <text content={recipe.mark ?? "o"} fg={markColor()} />
            </RadioGroupPrimitive.Indicator>
          </box>
          <text
            content={recipe.label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </RadioGroupPrimitive.Item>
  );
}
