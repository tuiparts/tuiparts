/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { tint } from "./theme";
import { useTheme } from "./use-theme";

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const DrawerContext = createContext<DrawerContextValue | null>(null);

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Drawer({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <DrawerContext.Provider value={contextValue}>
      <box flexDirection="column">{children}</box>
    </DrawerContext.Provider>
  );
}

export interface DrawerTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function DrawerTrigger({ children, ...rest }: DrawerTriggerProps) {
  const context = useContext(DrawerContext);
  const tokens = useTheme();

  return (
    <Box
      backgroundColor={tokens.colors.surface}
      paddingLeft={tokens.density.paddingX}
      paddingRight={tokens.density.paddingX}
      onMouseUp={() => context?.setOpen(true)}
      {...rest}
    >
      {children}
    </Box>
  );
}

export interface DrawerCloseProps extends BoxOptions {
  children: ReactNode;
}

export function DrawerClose({ children, ...rest }: DrawerCloseProps) {
  const context = useContext(DrawerContext);
  const tokens = useTheme();

  return (
    <Box
      backgroundColor={tokens.colors.surface}
      paddingLeft={tokens.density.paddingX}
      paddingRight={tokens.density.paddingX}
      onMouseUp={() => context?.setOpen(false)}
      {...rest}
    >
      {children}
    </Box>
  );
}

export interface DrawerContentProps extends BoxOptions {
  children: ReactNode;
}

export function DrawerContent({ children, ...rest }: DrawerContentProps) {
  const context = useContext(DrawerContext);
  const tokens = useTheme();

  if (context && !context.open) {
    return null;
  }

  return (
    <box position="absolute" width="100%" height="100%" top={0} left={0}>
      {/* Backdrop */}
      <Box
        position="absolute"
        width="100%"
        height="100%"
        backgroundColor={tint(
          tokens.colors.background,
          tokens.colors.foreground,
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
        borderColor={tokens.colors.border}
        backgroundColor={tokens.colors.surface}
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        {...rest}
      >
        {/* Grab Handle */}
        <box
          width={8}
          height={1}
          backgroundColor={tokens.colors.mutedForeground}
          alignSelf="center"
          marginBottom={1}
        />
        {children}
      </box>
    </box>
  );
}

export interface DrawerHeaderProps extends BoxOptions {
  children: ReactNode;
}

export function DrawerHeader({ children, ...rest }: DrawerHeaderProps) {
  return (
    <box flexDirection="column" gap={1} marginBottom={1} {...rest}>
      {children}
    </box>
  );
}

export interface DrawerFooterProps extends BoxOptions {
  children: ReactNode;
}

export function DrawerFooter({ children, ...rest }: DrawerFooterProps) {
  return (
    <box
      flexDirection="row"
      justifyContent="flex-end"
      gap={1}
      marginTop={1}
      {...rest}
    >
      {children}
    </box>
  );
}

export interface DrawerTitleProps extends TextOptions {
  children: string;
}

export function DrawerTitle({ children, ...rest }: DrawerTitleProps) {
  const tokens = useTheme();
  return <text content={children} fg={tokens.colors.foreground} {...rest} />;
}

export interface DrawerDescriptionProps extends TextOptions {
  children: string;
}

export function DrawerDescription({
  children,
  ...rest
}: DrawerDescriptionProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}
