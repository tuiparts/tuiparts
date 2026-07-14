/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { splitProps } from "solid-js";

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

/** Consumer-owned Solid recipe composed from ordinary OpenTUI elements. */
export function Badge(props: BadgeProps) {
  const [recipe, root] = splitProps(props, [
    "intent",
    "label",
    "labelOptions",
    "size",
  ]);
  const palette = () => palettes[recipe.intent ?? "neutral"];

  return (
    <box
      backgroundColor={palette().background}
      paddingX={recipe.size === "comfortable" ? 2 : 1}
      {...root}
    >
      <text
        content={recipe.label}
        fg={palette().foreground}
        {...recipe.labelOptions}
      />
    </box>
  );
}
