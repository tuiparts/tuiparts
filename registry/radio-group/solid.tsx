/** @jsxImportSource @opentui/solid */

import { Radio as RadioPrimitive } from "@opentui-ui/solid/radio";
import { RadioGroup as RadioGroupPrimitive } from "@opentui-ui/solid/radio-group";
import { splitProps } from "solid-js";

export interface RadioGroupProps extends RadioGroupPrimitive.Props {}

export interface RadioGroupItemProps
  extends Omit<RadioPrimitive.Root.Props, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned group layout on top of packaged collection behavior. */
export function RadioGroup(props: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
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
    <RadioPrimitive.Root
      flexDirection="row"
      gap={1}
      height={1}
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...item}
    >
      {(state: RadioPrimitive.Root.State) => (
        <>
          <box width={1}>
            <RadioPrimitive.Indicator>
              <text content={recipe.mark ?? "o"} fg={markColor()} />
            </RadioPrimitive.Indicator>
          </box>
          <text
            content={recipe.label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </RadioPrimitive.Root>
  );
}
