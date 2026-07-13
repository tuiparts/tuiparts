/** @jsxImportSource @opentui/react */

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "@opentui-ui/react/button";

export interface ButtonProps extends Omit<ButtonPrimitiveProps, "children"> {
  intent?: "neutral" | "primary";
  label: string;
  size?: "compact" | "comfortable";
}

const backgrounds = {
  neutral: "#404040",
  primary: "#2563EB",
} as const;

/** Consumer-owned React recipe installed on packaged Button behavior. */
export function Button({
  intent = "primary",
  label,
  size = "compact",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <box
          backgroundColor={
            state.disabled
              ? "#262626"
              : state.pressed
                ? "#1D4ED8"
                : state.focused
                  ? "#3B82F6"
                  : backgrounds[intent]
          }
          paddingX={size === "comfortable" ? 2 : 1}
        >
          <text content={label} fg={state.disabled ? "#737373" : "#F5F5F5"} />
        </box>
      )}
    </ButtonPrimitive>
  );
}
