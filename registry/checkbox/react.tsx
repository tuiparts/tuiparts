/** @jsxImportSource @opentui/react */

import {
  CheckboxPrimitive,
  type CheckboxPrimitiveRootProps,
} from "@opentui-ui/react/checkbox";

export interface CheckboxProps
  extends Omit<CheckboxPrimitiveRootProps, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged primitive behavior. */
export function Checkbox({
  label,
  mark = "✓",
  tone = "accent",
  disabled,
  ...props
}: CheckboxProps) {
  const markColor = tone === "success" ? "#10B981" : "#3B82F6";

  return (
    <CheckboxPrimitive.Root
      flexDirection="row"
      gap={1}
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <>
          <box width={1}>
            <CheckboxPrimitive.Indicator>
              <text content={mark} fg={markColor} />
            </CheckboxPrimitive.Indicator>
          </box>
          <text
            content={label}
            fg={
              state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#E5E5E5"
            }
          />
        </>
      )}
    </CheckboxPrimitive.Root>
  );
}
