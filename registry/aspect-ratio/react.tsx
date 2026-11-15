/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import type { PropsWithChildren } from "react";

export interface AspectRatioProps extends PropsWithChildren<BoxOptions> {
  ratio?: number;
}

/** Consumer-owned React AspectRatio container constraining child dimensions. */
export function AspectRatio({
  children,
  height,
  ratio = 16 / 9,
  width,
  ...props
}: AspectRatioProps) {
  let computedWidth = width;
  let computedHeight = height;

  if (typeof width === "number" && height === undefined) {
    computedHeight = Math.max(1, Math.round(width / ratio));
  } else if (typeof height === "number" && width === undefined) {
    computedWidth = Math.max(1, Math.round(height * ratio));
  }

  return (
    <box height={computedHeight} width={computedWidth} {...props}>
      {children}
    </box>
  );
}
