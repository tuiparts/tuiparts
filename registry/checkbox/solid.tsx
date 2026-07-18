/** @jsxImportSource @opentui/solid */

import { RGBA } from "@opentui/core";
import { Checkbox as CheckboxPrimitive } from "@tuiparts/solid/checkbox";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface CheckboxProps
  extends Omit<CheckboxPrimitive.Root.Props, "children"> {
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged primitive behavior. */
export function Checkbox(props: CheckboxProps) {
  const [recipe, root] = splitProps(props, [
    "label",
    "mark",
    "tone",
    "disabled",
  ]);
  const tokens = useTheme();
  const markColor = () =>
    recipe.tone === "success" ? RGBA.fromIndex(2) : tokens().colors.primary;

  return (
    <CheckboxPrimitive.Root
      flexDirection="row"
      gap={1}
      backgroundColor="transparent"
      disabled={recipe.disabled}
      {...root}
    >
      {(state: CheckboxPrimitive.Root.State) => (
        <>
          <box width={1}>
            <CheckboxPrimitive.Indicator>
              <text
                content={recipe.mark ?? tokens().glyphs.check}
                fg={markColor()}
              />
            </CheckboxPrimitive.Indicator>
          </box>
          <text
            content={recipe.label}
            fg={
              state.disabled
                ? tokens().colors.disabledForeground
                : state.focused
                  ? tokens().colors.focus
                  : tokens().colors.foreground
            }
          />
        </>
      )}
    </CheckboxPrimitive.Root>
  );
}
