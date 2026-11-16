/** @jsxImportSource @opentui/solid */

import type { ColorInput } from "@opentui/core";
import {
  SPINNER_FRAMES,
  type SpinnerPreset,
  Spinner as SpinnerPrimitive,
} from "@tuiparts/solid";
import { createMemo, type JSX, Show, splitProps } from "solid-js";
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
  label?: string;
  children?: JSX.Element;
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

export function Spinner(props: SpinnerProps): JSX.Element {
  const tokens = useTheme();
  const [local, rootProps] = splitProps(props, [
    "preset",
    "frames",
    "intent",
    "label",
    "children",
    "gap",
  ]);

  const activeFrames = createMemo(() => {
    return (
      local.frames ??
      SPINNER_FRAMES[local.preset ?? "braille"] ??
      SPINNER_FRAMES.braille
    );
  });

  const spinnerColor = createMemo(() => {
    return colorForIntent(tokens().colors, local.intent ?? "primary");
  });

  const effectiveGap = createMemo(() => {
    return local.gap ?? (local.label || local.children ? 1 : 0);
  });

  return (
    <SpinnerPrimitive.Root
      {...rootProps}
      frames={activeFrames()}
      flexDirection="row"
      alignItems="center"
      gap={effectiveGap()}
    >
      <SpinnerPrimitive.Indicator fg={spinnerColor()} />
      <Show when={local.label}>
        <SpinnerPrimitive.Label
          content={local.label}
          fg={tokens().colors.foreground}
        />
      </Show>
      {local.children}
    </SpinnerPrimitive.Root>
  );
}
