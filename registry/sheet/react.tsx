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

export type SheetSide = "top" | "bottom" | "left" | "right";

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const SheetContext = createContext<SheetContextValue | null>(null);

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: SheetProps) {
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
    <SheetContext.Provider value={contextValue}>
      <box flexDirection="column">{children}</box>
    </SheetContext.Provider>
  );
}

export interface SheetTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function SheetTrigger({ children, ...rest }: SheetTriggerProps) {
  const context = useContext(SheetContext);
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

export interface SheetCloseProps extends BoxOptions {
  children: ReactNode;
}

export function SheetClose({ children, ...rest }: SheetCloseProps) {
  const context = useContext(SheetContext);
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

export interface SheetContentProps extends BoxOptions {
  side?: SheetSide;
  children: ReactNode;
}

export function SheetContent({
  side = "right",
  children,
  ...rest
}: SheetContentProps) {
  const context = useContext(SheetContext);
  const tokens = useTheme();

  if (context && !context.open) {
    return null;
  }

  const sideStyle = getSideStyle(side);

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

      {/* Docked Sheet Box */}
      <box
        position="absolute"
        border
        borderStyle="single"
        borderColor={tokens.colors.border}
        backgroundColor={tokens.colors.surface}
        flexDirection="column"
        paddingX={1}
        paddingY={1}
        {...sideStyle}
        {...rest}
      >
        {children}
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
  children: ReactNode;
}

export function SheetHeader({ children, ...rest }: SheetHeaderProps) {
  return (
    <box flexDirection="column" gap={1} marginBottom={1} {...rest}>
      {children}
    </box>
  );
}

export interface SheetFooterProps extends BoxOptions {
  children: ReactNode;
}

export function SheetFooter({ children, ...rest }: SheetFooterProps) {
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

export interface SheetTitleProps extends TextOptions {
  children: string;
}

export function SheetTitle({ children, ...rest }: SheetTitleProps) {
  const tokens = useTheme();
  return <text content={children} fg={tokens.colors.foreground} {...rest} />;
}

export interface SheetDescriptionProps extends TextOptions {
  children: string;
}

export function SheetDescription({ children, ...rest }: SheetDescriptionProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}
