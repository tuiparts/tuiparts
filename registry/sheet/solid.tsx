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
import { tint } from "./theme";
import { useTheme } from "./use-theme";

export type SheetSide = "top" | "bottom" | "left" | "right";

interface SheetContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const SheetContext = createContext<SheetContextValue>();

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function Sheet(props: SheetProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = () => (props.open !== undefined ? props.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const contextValue: SheetContextValue = { open, setOpen };

  return (
    <SheetContext.Provider value={contextValue}>
      <box flexDirection="column">{props.children}</box>
    </SheetContext.Provider>
  );
}

export interface SheetTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function SheetTrigger(props: SheetTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(SheetContext);
  const tokens = useTheme();

  return (
    <Box
      backgroundColor={tokens().colors.surface}
      paddingLeft={tokens().density.paddingX}
      paddingRight={tokens().density.paddingX}
      onMouseUp={() => context?.setOpen(true)}
      {...rest}
    >
      {local.children}
    </Box>
  );
}

export interface SheetCloseProps extends BoxOptions {
  children?: JSX.Element;
}

export function SheetClose(props: SheetCloseProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(SheetContext);
  const tokens = useTheme();

  return (
    <Box
      backgroundColor={tokens().colors.surface}
      paddingLeft={tokens().density.paddingX}
      paddingRight={tokens().density.paddingX}
      onMouseUp={() => context?.setOpen(false)}
      {...rest}
    >
      {local.children}
    </Box>
  );
}

export interface SheetContentProps extends BoxOptions {
  side?: SheetSide;
  children?: JSX.Element;
}

export function SheetContent(props: SheetContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["side", "children"]);
  const context = useContext(SheetContext);
  const tokens = useTheme();

  const side = () => local.side ?? "right";
  const sideStyle = () => getSideStyle(side());

  return (
    <box
      position="absolute"
      width="100%"
      height="100%"
      top={0}
      left={0}
      visible={context?.open() ?? true}
    >
      {/* Backdrop */}
      <Box
        position="absolute"
        width="100%"
        height="100%"
        backgroundColor={tint(
          tokens().colors.background,
          tokens().colors.foreground,
          0.25,
        )}
        onMouseUp={() => context?.setOpen(false)}
      />

      {/* Docked Sheet Box */}
      <box
        position="absolute"
        border
        borderStyle="single"
        borderColor={tokens().colors.border}
        backgroundColor={tokens().colors.surface}
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        {...sideStyle()}
        {...rest}
      >
        {local.children}
      </box>
    </box>
  );
}

function getSideStyle(side: SheetSide): Partial<BoxOptions> {
  switch (side) {
    case "right":
      return {
        right: 0,
        top: 0,
        bottom: 0,
        width: "40%",
        maxWidth: 40,
      };
    case "left":
      return {
        left: 0,
        top: 0,
        bottom: 0,
        width: "40%",
        maxWidth: 40,
      };
    case "top":
      return {
        top: 0,
        left: 0,
        right: 0,
        height: "40%",
      };
    case "bottom":
      return {
        bottom: 0,
        left: 0,
        right: 0,
        height: "40%",
      };
  }
}

export interface SheetHeaderProps extends BoxOptions {
  children?: JSX.Element;
}

export function SheetHeader(props: SheetHeaderProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" gap={1} marginBottom={1} {...rest}>
      {local.children}
    </box>
  );
}

export interface SheetFooterProps extends BoxOptions {
  children?: JSX.Element;
}

export function SheetFooter(props: SheetFooterProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box
      flexDirection="row"
      justifyContent="flex-end"
      gap={1}
      marginTop={1}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export interface SheetTitleProps extends TextOptions {
  children: string;
}

export function SheetTitle(props: SheetTitleProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();
  return (
    <text content={local.children} fg={tokens().colors.foreground} {...rest} />
  );
}

export interface SheetDescriptionProps extends TextOptions {
  children: string;
}

export function SheetDescription(props: SheetDescriptionProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();
  return (
    <text
      content={local.children}
      fg={tokens().colors.mutedForeground}
      {...rest}
    />
  );
}
