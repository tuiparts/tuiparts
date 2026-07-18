/** @jsxImportSource @opentui/solid */

import { Button as ButtonPrimitive } from "@tuiparts/solid/button";
import { splitProps } from "solid-js";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

export interface ButtonProps extends Omit<ButtonPrimitive.Props, "children"> {
  intent?: "neutral" | "primary";
  label: string;
  size?: "compact" | "comfortable";
}

/** Consumer-owned Solid recipe installed on packaged Button behavior. */
export function Button(props: ButtonProps) {
  const [recipe, root] = splitProps(props, [
    "disabled",
    "intent",
    "label",
    "size",
  ]);
  const tokens = useTheme();

  return (
    <ButtonPrimitive
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...root}
    >
      {(state: ButtonPrimitive.State) => (
        <box
          backgroundColor={
            state.disabled
              ? tokens().colors.disabled
              : state.pressed
                ? tint(tokens().colors.focus, tokens().colors.foreground, 0.3)
                : state.focused
                  ? tokens().colors.focus
                  : (recipe.intent ?? "primary") === "primary"
                    ? tokens().colors.primary
                    : tokens().colors.surface
          }
          paddingX={
            recipe.size === "comfortable"
              ? tokens().density.comfortablePaddingX
              : tokens().density.paddingX
          }
        >
          <text
            content={recipe.label}
            fg={
              state.disabled
                ? tokens().colors.disabledForeground
                : (recipe.intent ?? "primary") === "primary"
                  ? tokens().colors.primaryForeground
                  : tokens().colors.foreground
            }
          />
        </box>
      )}
    </ButtonPrimitive>
  );
}
