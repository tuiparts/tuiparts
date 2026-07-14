/** @jsxImportSource @opentui/solid */

import { Button as ButtonPrimitive } from "@opentui-ui/solid/button";
import { splitProps } from "solid-js";

export interface ButtonProps extends Omit<ButtonPrimitive.Props, "children"> {
  intent?: "neutral" | "primary";
  label: string;
  size?: "compact" | "comfortable";
}

const backgrounds = {
  neutral: "#404040",
  primary: "#2563EB",
} as const;

/** Consumer-owned Solid recipe installed on packaged Button behavior. */
export function Button(props: ButtonProps) {
  const [recipe, root] = splitProps(props, [
    "disabled",
    "intent",
    "label",
    "size",
  ]);

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
              ? "#262626"
              : state.pressed
                ? "#1D4ED8"
                : state.focused
                  ? "#3B82F6"
                  : backgrounds[recipe.intent ?? "primary"]
          }
          paddingX={recipe.size === "comfortable" ? 2 : 1}
        >
          <text
            content={recipe.label}
            fg={state.disabled ? "#737373" : "#F5F5F5"}
          />
        </box>
      )}
    </ButtonPrimitive>
  );
}
