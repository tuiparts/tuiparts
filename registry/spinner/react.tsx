/** @jsxImportSource @opentui/react */

import type { ColorInput } from "@opentui/core";
import {
  SPINNER_FRAMES,
  type SpinnerPreset,
  Spinner as SpinnerPrimitive,
} from "@tuiparts/react";
import { type ReactNode, useMemo } from "react";
import type { Tokens } from "./theme";
import { useTheme } from "./use-theme";

export type SpinnerIntent =
  | "primary"
  | "neutral"
  | "muted"
  | "success"
  | "warning"
  | "danger";

export interface SpinnerProps
  extends Omit<SpinnerPrimitive.Root.Props, "children"> {
  preset?: SpinnerPreset;
  intent?: SpinnerIntent;
  label?: ReactNode;
  children?: ReactNode;
}

const colorForIntent = (
  colors: Tokens["colors"],
  intent: SpinnerIntent,
): ColorInput => {
  switch (intent) {
    case "primary":
      return colors.primary;
    case "muted":
      return colors.mutedForeground;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.destructive;
    default:
      return colors.foreground;
  }
};

export function Spinner({
  preset = "braille",
  frames,
  intent = "primary",
  label,
  children,
  gap,
  ...props
}: SpinnerProps) {
  const tokens = useTheme();
  const activeFrames = useMemo(() => {
    return frames ?? SPINNER_FRAMES[preset] ?? SPINNER_FRAMES.braille;
  }, [frames, preset]);

  const spinnerColor = colorForIntent(tokens.colors, intent);
  const effectiveGap = gap ?? (label || children ? 1 : 0);

  return (
    <SpinnerPrimitive.Root
      {...props}
      frames={activeFrames}
      flexDirection="row"
      alignItems="center"
      gap={effectiveGap}
    >
      <SpinnerPrimitive.Indicator fg={spinnerColor} />
      {label ? (
        <SpinnerPrimitive.Label
          content={typeof label === "string" ? label : undefined}
          fg={tokens.colors.foreground}
        />
      ) : null}
      {children ?? null}
    </SpinnerPrimitive.Root>
  );
}
