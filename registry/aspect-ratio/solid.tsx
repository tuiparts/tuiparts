/** @jsxImportSource @opentui/solid */

import type { BoxOptions } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";

export interface AspectRatioProps extends BoxOptions {
  children?: JSX.Element;
  ratio?: number;
}

/** Consumer-owned Solid AspectRatio container constraining child dimensions. */
export function AspectRatio(props: AspectRatioProps) {
  const [local, root] = splitProps(props, [
    "children",
    "height",
    "ratio",
    "width",
  ]);

  const ratio = () => local.ratio ?? 16 / 9;
  const computedDimensions = () => {
    let w = local.width;
    let h = local.height;
    if (typeof w === "number" && h === undefined) {
      h = Math.max(1, Math.round(w / ratio()));
    } else if (typeof h === "number" && w === undefined) {
      w = Math.max(1, Math.round(h * ratio()));
    }
    return { height: h, width: w };
  };

  return (
    <box
      height={computedDimensions().height}
      width={computedDimensions().width}
      {...root}
    >
      {local.children}
    </box>
  );
}
