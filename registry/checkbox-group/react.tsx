/** @jsxImportSource @opentui/react */

import { Checkbox as CheckboxPrimitive } from "@tuiparts/react/checkbox";
import { CheckboxGroup as CheckboxGroupPrimitive } from "@tuiparts/react/checkbox-group";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React CheckboxGroup layout. */
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

/** Consumer-owned React CheckboxGroup layout. */
export function CheckboxGroup({ orientation, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      flexDirection={orientation === "horizontal" ? "row" : "column"}
      gap={1}
      orientation={orientation}
      {...props}
    />
  );
}

/** Consumer-owned grouped Checkbox presentation. */
export function CheckboxGroupItem({
  label,
  mark,
  tone = "accent",
  disabled,
  ...props
}: CheckboxGroupItemProps) {
  const tokens = useTheme();
  const markColor =
    tone === "success" ? tokens.colors.success : tokens.colors.primary;
  return (
    <CheckboxPrimitive.Root
      backgroundColor="transparent"
      disabled={disabled}
      flexDirection="row"
      gap={1}
      {...props}
    >
      {(state) => (
        <>
          <box width={1}>
            <CheckboxPrimitive.Indicator>
              <text content={mark ?? tokens.glyphs.check} fg={markColor} />
            </CheckboxPrimitive.Indicator>
          </box>
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : state.focused
                  ? tokens.colors.focus
                  : tokens.colors.foreground
            }
          />
        </>
      )}
    </CheckboxPrimitive.Root>
  );
}
