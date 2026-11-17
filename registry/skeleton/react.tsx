/** @jsxImportSource @opentui/react */

import type { BoxOptions, BoxRenderable } from "@opentui/core";
import { useTimeline } from "@opentui/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useTheme } from "./use-theme";

export interface SkeletonProps extends BoxOptions {
  /** When true (default), pulses opacity between 1.0 and 0.4 matching shadcn animate-pulse. */
  animate?: boolean;
  children?: ReactNode;
}

/** Consumer-owned React Skeleton recipe composed from ordinary OpenTUI elements. */
export function Skeleton({
  animate = true,
  backgroundColor,
  children,
  shouldFill = true,
  ...props
}: SkeletonProps) {
  const tokens = useTheme();
  const boxRef = useRef<BoxRenderable | null>(null);
  const timeline = useTimeline({ duration: 2000, loop: true, autoplay: false });

  useEffect(() => {
    if (!animate || !boxRef.current) return;
    timeline.add(boxRef.current, {
      opacity: 0.4,
      duration: 1000,
      alternate: true,
      loop: true,
    });
    timeline.play();
    return () => {
      timeline.pause();
    };
  }, [animate, timeline]);

  return (
    <box
      ref={boxRef}
      backgroundColor={backgroundColor ?? tokens.colors.surface}
      shouldFill={shouldFill}
      {...props}
    >
      {children}
    </box>
  );
}
