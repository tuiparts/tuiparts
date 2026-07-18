/** @jsxImportSource @opentui/solid */

import { Input as InputPrimitive } from "@tuiparts/solid/input";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

export interface InputProps extends InputPrimitive.Props {}

/** Consumer-owned Solid Input recipe with editable visual defaults. */
export function Input(props: InputProps) {
  const tokens = useTheme();
  return (
    <InputPrimitive
      backgroundColor="transparent"
      cursorColor={tokens().colors.foreground}
      focusedBackgroundColor="transparent"
      focusedTextColor={tint(
        tokens().colors.foreground,
        tokens().colors.focus,
        0.35,
      )}
      placeholderColor={tokens().colors.mutedForeground}
      textColor={tokens().colors.foreground}
      {...props}
    />
  );
}
