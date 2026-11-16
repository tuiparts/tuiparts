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

interface DrawerContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const DrawerContext = createContext<DrawerContextValue>();

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function Drawer(props: DrawerProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = () => (props.open !== undefined ? props.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const contextValue: DrawerContextValue = { open, setOpen };

  return (
    <DrawerContext.Provider value={contextValue}>
      <box flexDirection="column">{props.children}</box>
    </DrawerContext.Provider>
  );
}

export interface DrawerTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function DrawerTrigger(props: DrawerTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(DrawerContext);
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

export interface DrawerCloseProps extends BoxOptions {
  children?: JSX.Element;
}

export function DrawerClose(props: DrawerCloseProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(DrawerContext);
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

export interface DrawerContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function DrawerContent(props: DrawerContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(DrawerContext);
  const tokens = useTheme();

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

      {/* Docked Drawer Bottom Box */}
      <box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        height="50%"
        border
        borderStyle="single"
        borderColor={tokens().colors.border}
        backgroundColor={tokens().colors.surface}
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        {...rest}
      >
        {/* Grab Handle */}
        <box
          width={8}
          height={1}
          backgroundColor={tokens().colors.mutedForeground}
          alignSelf="center"
          marginBottom={1}
        />
        {local.children}
      </box>
    </box>
  );
}

export interface DrawerHeaderProps extends BoxOptions {
  children?: JSX.Element;
}

export function DrawerHeader(props: DrawerHeaderProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" gap={1} marginBottom={1} {...rest}>
      {local.children}
    </box>
  );
}

export interface DrawerFooterProps extends BoxOptions {
  children?: JSX.Element;
}

export function DrawerFooter(props: DrawerFooterProps): JSX.Element {
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

export interface DrawerTitleProps extends TextOptions {
  children: string;
}

export function DrawerTitle(props: DrawerTitleProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();
  return (
    <text content={local.children} fg={tokens().colors.foreground} {...rest} />
  );
}

export interface DrawerDescriptionProps extends TextOptions {
  children: string;
}

export function DrawerDescription(props: DrawerDescriptionProps): JSX.Element {
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
