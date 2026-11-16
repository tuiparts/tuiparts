/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import {
  type Accessor,
  createContext,
  createSignal,
  type JSX,
  splitProps,
  useContext,
} from "solid-js";
import { useTheme } from "./use-theme";

interface TooltipContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const TooltipContext = createContext<TooltipContextValue>();

export interface TooltipProviderProps {
  children?: JSX.Element;
}

export function TooltipProvider(props: TooltipProviderProps): JSX.Element {
  return <>{props.children}</>;
}

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = () => (props.open !== undefined ? props.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const contextValue: TooltipContextValue = { open, setOpen };

  return (
    <TooltipContext.Provider value={contextValue}>
      <box flexDirection="column">{props.children}</box>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function TooltipTrigger(props: TooltipTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(TooltipContext);

  return (
    <Box
      onMouseOver={() => context?.setOpen(true)}
      onMouseOut={() => context?.setOpen(false)}
      {...rest}
    >
      {local.children}
    </Box>
  );
}

export interface TooltipContentProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export function TooltipContent(props: TooltipContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "content",
    "textOptions",
  ]);
  const context = useContext(TooltipContext);
  const tokens = useTheme();

  return (
    <box
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      height={3}
      visible={context?.open() ?? true}
      {...rest}
    >
      {local.content ? (
        <text
          content={local.content}
          fg={tokens().colors.foreground}
          {...local.textOptions}
        />
      ) : (
        local.children
      )}
    </box>
  );
}
