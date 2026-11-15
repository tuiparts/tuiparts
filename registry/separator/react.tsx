/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import { useTheme } from "./use-theme";

export type SeparatorOrientation = "horizontal" | "vertical";

/** Props for the consumer-owned React Separator recipe. */
export interface SeparatorProps extends BoxOptions {
  /**
   * Whether the element is purely decorative.
   * Preserved for accessibility/semantics parity with shadcn.
   * @default true
   */
  decorative?: boolean;
  /**
   * The orientation of the separator.
   * @default "horizontal"
   */
  orientation?: SeparatorOrientation;
}

/** Consumer-owned React Separator recipe composed directly from OpenTUI Box. */
export function Separator({
  borderColor,
  borderStyle,
  decorative = true,
  height,
  orientation = "horizontal",
  width,
  ...props
}: SeparatorProps) {
  const tokens = useTheme();
  const isHorizontal = orientation === "horizontal";

  return (
    <box
      border={[isHorizontal ? "top" : "left"]}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      height={height ?? (isHorizontal ? 1 : undefined)}
      width={width ?? (isHorizontal ? undefined : 1)}
      {...props}
    />
  );
}
