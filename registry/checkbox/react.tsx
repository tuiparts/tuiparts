/** @jsxImportSource @opentui/react */

import { Checkbox as CheckboxPrimitive } from "@tuiparts/react/checkbox";
import { useTheme } from "./use-theme";

export interface CheckboxProps
  extends Omit<CheckboxPrimitive.Root.Props, "children"> {
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged primitive behavior. */
export function Checkbox({
  label,
  mark,
  tone = "accent",
  disabled,
  ...props
}: CheckboxProps) {
  const tokens = useTheme();
  const markColor =
    tone === "success" ? tokens.colors.success : tokens.colors.primary;

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
