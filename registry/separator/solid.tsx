/** @jsxImportSource @opentui/solid */

import type { BoxOptions } from "@opentui/core";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export type SeparatorOrientation = "horizontal" | "vertical";

/** Props for the consumer-owned Solid Separator recipe. */
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

/** Consumer-owned Solid Separator recipe composed directly from OpenTUI Box. */
export function Separator(props: SeparatorProps) {
  const [local, root] = splitProps(props, [
    "borderColor",
    "borderStyle",
    "decorative",
    "height",
    "orientation",
    "width",
  ]);
  const tokens = useTheme();
  const isHorizontal = () =>
    (local.orientation ?? "horizontal") === "horizontal";

  return (
    <box
      border={[isHorizontal() ? "top" : "left"]}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      height={local.height ?? (isHorizontal() ? 1 : undefined)}
      width={local.width ?? (isHorizontal() ? undefined : 1)}
      {...root}
    />
  );
}
