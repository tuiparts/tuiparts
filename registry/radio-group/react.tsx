/** @jsxImportSource @opentui/react */

import {
  RadioGroup as RadioGroupPrimitive,
  type RadioGroupItemProps as RadioGroupPrimitiveItemProps,
  type RadioGroupProps as RadioGroupPrimitiveProps,
} from "@opentui-ui/react/radio";

export interface RadioGroupProps extends RadioGroupPrimitiveProps {}

export interface RadioGroupItemProps
  extends Omit<RadioGroupPrimitiveItemProps, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged collection behavior. */
export function RadioGroup({ children, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      flexDirection="column"
      gap={0}
      backgroundColor="transparent"
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Root>
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
    <RadioGroupPrimitive.Item
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
            <RadioGroupPrimitive.Indicator>
              <text content={mark} fg={markColor} />
            </RadioGroupPrimitive.Indicator>
          </box>
          <text
            content={label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </RadioGroupPrimitive.Item>
  );
}
