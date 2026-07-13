/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";

export type BadgeIntent = "danger" | "neutral" | "success" | "warning";
export type BadgeSize = "compact" | "comfortable";

export interface BadgeProps extends BoxOptions {
  intent?: BadgeIntent;
  label: string;
  labelOptions?: Omit<TextOptions, "content">;
  size?: BadgeSize;
}

const palettes = {
  danger: { background: "#991B1B", foreground: "#FEF2F2" },
  neutral: { background: "#404040", foreground: "#F5F5F5" },
  success: { background: "#166534", foreground: "#F0FDF4" },
  warning: { background: "#854D0E", foreground: "#FFFBEB" },
} as const;

/** Consumer-owned React recipe composed from ordinary OpenTUI elements. */
export function Badge({
  intent = "neutral",
  label,
  labelOptions,
  size = "compact",
  ...root
}: BadgeProps) {
  const palette = palettes[intent];

  return (
    <box
      backgroundColor={palette.background}
      paddingX={size === "comfortable" ? 2 : 1}
      {...root}
    >
      <text content={label} fg={palette.foreground} {...labelOptions} />
    </box>
  );
}
