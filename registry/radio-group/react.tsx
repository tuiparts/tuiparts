/** @jsxImportSource @opentui/react */

import { Radio as RadioPrimitive } from "@tuiparts/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@tuiparts/react/radio-group";
import { useTheme } from "./use-theme";

export interface RadioGroupProps extends RadioGroupPrimitive.Props {}

export interface RadioGroupItemProps
  extends Omit<RadioPrimitive.Root.Props, "children"> {
  label: string;
  mark?: string;
  tone?: "accent" | "success";
}

/** Consumer-owned recipe installed on top of packaged collection behavior. */
export function RadioGroup({ children, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      flexDirection="column"
      gap={0}
      backgroundColor="transparent"
      {...props}
    >
      {children}
    </RadioGroupPrimitive>
  );
}

/** Consumer-owned Item layout, label, mark, and colors. */
export function RadioGroupItem({
  label,
  mark,
  tone = "accent",
  disabled,
  ...props
}: RadioGroupItemProps) {
  const tokens = useTheme();
  const markColor =
    tone === "success" ? tokens.colors.success : tokens.colors.primary;

  return (
    <RadioPrimitive.Root
      flexDirection="row"
      gap={1}
      height={1}
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <>
          <box width={1}>
            <RadioPrimitive.Indicator>
              <text content={mark ?? tokens.glyphs.radio} fg={markColor} />
            </RadioPrimitive.Indicator>
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
    </RadioPrimitive.Root>
  );
}
