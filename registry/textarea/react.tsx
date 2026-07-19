/** @jsxImportSource @opentui/react */

import { Textarea as TextareaPrimitive } from "@tuiparts/react/textarea";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

/** Props accepted by the React Textarea Recipe. */
export interface TextareaProps extends TextareaPrimitive.Props {}

/** Consumer-owned React Textarea Recipe with editable visual defaults. */
export function Textarea(props: TextareaProps) {
  const tokens = useTheme();
  return (
    <TextareaPrimitive
      backgroundColor="transparent"
      cursorColor={tokens.colors.foreground}
      focusedBackgroundColor="transparent"
      focusedTextColor={tint(
        tokens.colors.foreground,
        tokens.colors.focus,
        0.35,
      )}
      height={5}
      placeholderColor={tokens.colors.mutedForeground}
      selectionBg={tint(tokens.colors.background, tokens.colors.focus, 0.45)}
      textColor={tokens.colors.foreground}
      wrapMode="word"
      {...props}
    />
  );
}
