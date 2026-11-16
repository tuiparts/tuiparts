/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { createContext, type ReactNode, useContext } from "react";
import { useTheme } from "./use-theme";

export type ResizableDirection = "horizontal" | "vertical";

interface ResizableContextValue {
  direction: ResizableDirection;
}

const ResizableContext = createContext<ResizableContextValue>({
  direction: "horizontal",
});

export interface ResizablePanelGroupProps extends BoxOptions {
  direction?: ResizableDirection;
  children: ReactNode;
}

export function ResizablePanelGroup({
  direction = "horizontal",
  children,
  ...rest
}: ResizablePanelGroupProps) {
  return (
    <ResizableContext.Provider value={{ direction }}>
      <box
        width="100%"
        height="100%"
        flexDirection={direction === "vertical" ? "column" : "row"}
        {...rest}
      >
        {children}
      </box>
    </ResizableContext.Provider>
  );
}

export interface ResizablePanelProps extends BoxOptions {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children?: ReactNode;
}

export function ResizablePanel({
  defaultSize = 1,
  minSize: _minSize,
  maxSize: _maxSize,
  children,
  ...rest
}: ResizablePanelProps) {
  return (
    <box flexGrow={defaultSize} flexShrink={1} flexBasis={0} {...rest}>
      {children}
    </box>
  );
}

export interface ResizableHandleProps extends BoxOptions {
  withHandle?: boolean;
  textOptions?: TextOptions;
}

export function ResizableHandle({
  withHandle = false,
  textOptions,
  ...rest
}: ResizableHandleProps) {
  const { direction } = useContext(ResizableContext);
  const tokens = useTheme();
  const isHorizontal = direction === "horizontal";

  return (
    <box
      width={isHorizontal ? 1 : "100%"}
      height={isHorizontal ? "100%" : 1}
      backgroundColor={tokens.colors.border}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {withHandle ? (
        <text
          content={isHorizontal ? "⁞" : "···"}
          fg={tokens.colors.mutedForeground}
          {...textOptions}
        />
      ) : null}
    </box>
  );
}
