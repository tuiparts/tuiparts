/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import type { Tokens } from "./theme";
import { useTheme } from "./use-theme";

export type BadgeIntent = "danger" | "neutral" | "success" | "warning";
export type BadgeSize = "compact" | "comfortable";

export interface BadgeProps extends BoxOptions {
  intent?: BadgeIntent;
  label: string;
  labelOptions?: Omit<TextOptions, "content">;
  size?: BadgeSize;
}

const palettes = (colors: Tokens["colors"]) => ({
  danger: {
    background: colors.destructive,
    foreground: colors.destructiveForeground,
  },
  neutral: { background: colors.surface, foreground: colors.foreground },
  success: { background: colors.success, foreground: colors.successForeground },
  warning: {
    background: colors.warning,
    foreground: colors.warningForeground,
  },
});

/** Consumer-owned React recipe composed from ordinary OpenTUI elements. */
export function Badge({
  intent = "neutral",
  label,
  labelOptions,
  size = "compact",
  ...root
}: BadgeProps) {
  const tokens = useTheme();
  const palette = palettes(tokens.colors)[intent];

  return (
    <box
      backgroundColor={palette.background}
      paddingX={
        size === "comfortable"
          ? tokens.density.comfortablePaddingX
          : tokens.density.paddingX
      }
      {...root}
    >
      <text content={label} fg={palette.foreground} {...labelOptions} />
    </box>
  );
}
