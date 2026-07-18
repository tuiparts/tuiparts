/** @jsxImportSource @opentui/react */

import { Button as ButtonPrimitive } from "@tuiparts/react/button";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

export interface ButtonProps extends Omit<ButtonPrimitive.Props, "children"> {
  intent?: "neutral" | "primary";
  label: string;
  size?: "compact" | "comfortable";
}

/** Consumer-owned React recipe installed on packaged Button behavior. */
export function Button({
  intent = "primary",
  label,
  size = "compact",
  disabled,
  ...props
}: ButtonProps) {
  const tokens = useTheme();
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
              ? tokens.colors.disabled
              : state.pressed
                ? tint(tokens.colors.focus, tokens.colors.foreground, 0.3)
                : state.focused
                  ? tokens.colors.focus
                  : intent === "primary"
                    ? tokens.colors.primary
                    : tokens.colors.surface
          }
          paddingX={
            size === "comfortable"
              ? tokens.density.comfortablePaddingX
              : tokens.density.paddingX
          }
        >
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : intent === "primary"
                  ? tokens.colors.primaryForeground
                  : tokens.colors.foreground
            }
          />
        </box>
      )}
    </ButtonPrimitive>
  );
}
