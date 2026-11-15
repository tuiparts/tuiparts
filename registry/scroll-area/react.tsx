/** @jsxImportSource @opentui/react */

import type { ScrollBoxOptions } from "@opentui/core";
import type { PropsWithChildren } from "react";
import { useTheme } from "./use-theme";

export interface ScrollAreaProps extends PropsWithChildren<ScrollBoxOptions> {}

/** Consumer-owned React ScrollArea viewport container. */
export function ScrollArea({
  border = true,
  borderColor,
  borderStyle,
  children,
  scrollY = true,
  ...props
}: ScrollAreaProps) {
  const tokens = useTheme();

  return (
    <scrollbox
      border={border}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      scrollY={scrollY}
      {...props}
    >
      {children}
    </scrollbox>
  );
}
