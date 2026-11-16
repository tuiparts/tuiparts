/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import {
  type Accessor,
  createContext,
  type JSX,
  splitProps,
  useContext,
} from "solid-js";
import { useTheme } from "./use-theme";

export type ResizableDirection = "horizontal" | "vertical";

interface ResizableContextValue {
  direction: Accessor<ResizableDirection>;
}

const ResizableContext = createContext<ResizableContextValue>({
  direction: () => "horizontal" as ResizableDirection,
});

export interface ResizablePanelGroupProps extends BoxOptions {
  direction?: ResizableDirection;
  children?: JSX.Element;
}

export function ResizablePanelGroup(
  props: ResizablePanelGroupProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["direction", "children"]);
  const direction = () => local.direction ?? "horizontal";

  return (
    <ResizableContext.Provider value={{ direction }}>
      <box
        width="100%"
        height="100%"
        flexDirection={direction() === "vertical" ? "column" : "row"}
        {...rest}
      >
        {local.children}
      </box>
    </ResizableContext.Provider>
  );
}

export interface ResizablePanelProps extends BoxOptions {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children?: JSX.Element;
}

export function ResizablePanel(props: ResizablePanelProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "defaultSize",
    "minSize",
    "maxSize",
    "children",
  ]);

  return (
    <box
      flexGrow={local.defaultSize ?? 1}
      flexShrink={1}
      flexBasis={0}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export interface ResizableHandleProps extends BoxOptions {
  withHandle?: boolean;
  textOptions?: TextOptions;
}

export function ResizableHandle(props: ResizableHandleProps): JSX.Element {
  const [local, rest] = splitProps(props, ["withHandle", "textOptions"]);
  const context = useContext(ResizableContext);
  const tokens = useTheme();
  const isHorizontal = () =>
    context ? context.direction() === "horizontal" : true;

  return (
    <box
      width={isHorizontal() ? 1 : "100%"}
      height={isHorizontal() ? "100%" : 1}
      backgroundColor={tokens().colors.border}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {local.withHandle ? (
        <text
          content={isHorizontal() ? "⁞" : "···"}
          fg={tokens().colors.mutedForeground}
          {...local.textOptions}
        />
      ) : null}
    </box>
  );
}
