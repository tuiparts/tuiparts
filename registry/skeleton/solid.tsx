/** @jsxImportSource @opentui/solid */

import type { BoxOptions, BoxRenderable } from "@opentui/core";
import type { JSX } from "@opentui/solid";
import { useTimeline } from "@opentui/solid";
import { onCleanup, onMount, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface SkeletonProps extends BoxOptions {
  /** When true (default), pulses opacity between 1.0 and 0.4 matching shadcn animate-pulse. */
  animate?: boolean;
  children?: JSX.Element;
}

/** Consumer-owned Solid Skeleton recipe composed from ordinary OpenTUI elements. */
export function Skeleton(props: SkeletonProps) {
  const [local, root] = splitProps(props, [
    "animate",
    "backgroundColor",
    "children",
    "shouldFill",
  ]);
  const tokens = useTheme();
  let boxRef: BoxRenderable | undefined;
  const timeline = useTimeline({ duration: 2000, loop: true, autoplay: false });

  onMount(() => {
    if (local.animate === false || !boxRef) return;
    timeline.add(boxRef, {
      opacity: 0.4,
      duration: 1000,
      alternate: true,
      loop: true,
    });
    timeline.play();

    onCleanup(() => {
      timeline.pause();
    });
  });

  return (
    <box
      ref={boxRef}
      backgroundColor={local.backgroundColor ?? tokens().colors.surface}
      shouldFill={local.shouldFill ?? true}
      {...root}
    >
      {local.children}
    </box>
  );
}
