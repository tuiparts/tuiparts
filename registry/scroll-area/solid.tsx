/** @jsxImportSource @opentui/solid */

import type { ScrollBoxOptions } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface ScrollAreaProps extends ScrollBoxOptions {
  children?: JSX.Element;
}

/** Consumer-owned Solid ScrollArea viewport container. */
export function ScrollArea(props: ScrollAreaProps) {
  const [local, root] = splitProps(props, [
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "scrollY",
  ]);
  const tokens = useTheme();

  return (
    <scrollbox
      border={local.border ?? true}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      scrollY={local.scrollY ?? true}
      {...root}
    >
      {local.children}
    </scrollbox>
  );
}
