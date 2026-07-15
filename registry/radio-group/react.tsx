/** @jsxImportSource @opentui/react */

import { Radio as RadioPrimitive } from "@tuiparts/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@tuiparts/react/radio-group";

export interface RadioGroupProps extends RadioGroupPrimitive.Props {}

export interface RadioGroupItemProps
  extends Omit<RadioPrimitive.Root.Props, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged collection behavior. */
export function RadioGroup({ children, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      flexDirection="column"
      gap={0}
      backgroundColor="transparent"
      {...props}
    >
      {children}
    </RadioGroupPrimitive>
  );
}

/** Consumer-owned Item layout, label, mark, and colors. */
export function RadioGroupItem({
  label,
  mark = "●",
  tone = "accent",
  disabled,
  ...props
}: RadioGroupItemProps) {
  const markColor = tone === "success" ? "#10B981" : "#3B82F6";

  return (
    <RadioPrimitive.Root
      flexDirection="row"
      gap={1}
      height={1}
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <>
          <box width={1}>
            <RadioPrimitive.Indicator>
              <text content={mark} fg={markColor} />
            </RadioPrimitive.Indicator>
          </box>
          <text
            content={label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </RadioPrimitive.Root>
  );
}
