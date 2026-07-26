/** @jsxImportSource @opentui/solid */

import { Checkbox as CheckboxPrimitive } from "@tuiparts/solid/checkbox";
import { CheckboxGroup as CheckboxGroupPrimitive } from "@tuiparts/solid/checkbox-group";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid CheckboxGroup layout. */
export type CheckboxGroupProps = CheckboxGroupPrimitive.Props;

/** Props for one consumer-owned grouped Checkbox. */
export interface CheckboxGroupItemProps
  extends Omit<CheckboxPrimitive.Root.Props, "children" | "value"> {
  /** Grouped Checkbox label. */
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  /** Semantic color treatment. */
  tone?: "accent" | "success";
  /** Unique value owned by CheckboxGroup. */
  value: string;
}

/** Consumer-owned Solid CheckboxGroup layout. */
export function CheckboxGroup(props: CheckboxGroupProps) {
  const [local, group] = splitProps(props, ["orientation"]);
  return (
    <CheckboxGroupPrimitive
      flexDirection={local.orientation === "horizontal" ? "row" : "column"}
      gap={1}
      orientation={local.orientation}
      {...group}
    />
  );
}

/** Consumer-owned grouped Checkbox presentation. */
export function CheckboxGroupItem(props: CheckboxGroupItemProps) {
  const [recipe, checkbox] = splitProps(props, [
    "disabled",
    "label",
    "mark",
    "tone",
  ]);
  const tokens = useTheme();
  return (
    <CheckboxPrimitive.Root
      backgroundColor="transparent"
      disabled={recipe.disabled}
      flexDirection="row"
      gap={1}
      {...checkbox}
    >
      {(state: CheckboxPrimitive.Root.State) => (
        <>
          <box width={1}>
            <CheckboxPrimitive.Indicator>
              <text
                content={recipe.mark ?? tokens().glyphs.check}
                fg={
                  recipe.tone === "success"
                    ? tokens().colors.success
                    : tokens().colors.primary
                }
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
