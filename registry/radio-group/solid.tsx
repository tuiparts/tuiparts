/** @jsxImportSource @opentui/solid */

import { RGBA } from "@opentui/core";
import { Radio as RadioPrimitive } from "@tuiparts/solid/radio";
import { RadioGroup as RadioGroupPrimitive } from "@tuiparts/solid/radio-group";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

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
  const tokens = useTheme();
  const markColor = () =>
    recipe.tone === "success" ? RGBA.fromIndex(2) : tokens().colors.primary;

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
              <text
                content={recipe.mark ?? tokens().glyphs.radio}
                fg={markColor()}
              />
            </RadioPrimitive.Indicator>
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
    </RadioPrimitive.Root>
  );
}
