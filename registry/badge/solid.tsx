/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { splitProps } from "solid-js";
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

const paletteFor = (colors: Tokens["colors"]) => ({
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

/** Consumer-owned Solid recipe composed from ordinary OpenTUI elements. */
export function Badge(props: BadgeProps) {
  const [recipe, root] = splitProps(props, [
    "intent",
    "label",
    "labelOptions",
    "size",
  ]);
  const tokens = useTheme();
  const palette = () => paletteFor(tokens().colors)[recipe.intent ?? "neutral"];

  return (
    <box
      backgroundColor={palette().background}
      paddingX={
        recipe.size === "comfortable"
          ? tokens().density.comfortablePaddingX
          : tokens().density.paddingX
      }
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
