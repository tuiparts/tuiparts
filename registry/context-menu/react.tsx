/** @jsxImportSource @opentui/react */

import type { BoxOptions, KeyEvent, TextOptions } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTheme } from "./use-theme";

interface ContextMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export interface ContextMenuProps extends BoxOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function ContextMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...rest
}: ContextMenuProps) {
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

  const handleKeyPress = useCallback(
    (key: KeyEvent) => {
      if (open && key.name === "escape") {
        setOpen(false);
      }
    },
    [open, setOpen],
  );

  useKeyboard(handleKeyPress);

  const contextValue = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <ContextMenuContext.Provider value={contextValue}>
      <box flexDirection="column" width={30} {...rest}>
        {children}
      </box>
    </ContextMenuContext.Provider>
  );
}

export interface ContextMenuTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function ContextMenuTrigger({
  children,
  ...rest
}: ContextMenuTriggerProps) {
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      paddingY={1}
      alignItems="center"
      justifyContent="center"
      onMouseUp={() => context?.setOpen(!context.open)}
      {...rest}
    >
      {typeof children === "string" ? (
        <text content={children} fg={tokens.colors.foreground} />
      ) : (
        children
      )}
    </Box>
  );
}

export interface ContextMenuContentProps extends BoxOptions {
  children: ReactNode;
}

export function ContextMenuContent({
  children,
  ...rest
}: ContextMenuContentProps) {
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  if (context && !context.open) {
    return null;
  }

  return (
    <box
      flexDirection="column"
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      paddingY={1}
      {...rest}
    >
      {children}
    </box>
  );
}

export interface ContextMenuItemProps extends BoxOptions {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export function ContextMenuItem({
  children,
  onSelect,
  disabled = false,
  ...rest
}: ContextMenuItemProps) {
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    if (disabled) return;
    context?.setOpen(false);
    onSelect?.();
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor="transparent"
      onMouseUp={handleClick}
      {...rest}
    >
      {typeof children === "string" ? (
        <text
          content={children}
          fg={
            disabled ? tokens.colors.mutedForeground : tokens.colors.foreground
          }
        />
      ) : (
        children
      )}
    </Box>
  );
}

export interface ContextMenuCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function ContextMenuCheckboxItem({
  checked = false,
  children,
  onSelect,
  ...rest
}: ContextMenuCheckboxItemProps) {
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    context?.setOpen(false);
    onSelect?.();
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      onMouseUp={handleClick}
      {...rest}
    >
      <box flexDirection="row" alignItems="center" gap={1}>
        <text content={checked ? "✓" : " "} fg={tokens.colors.primary} />
        {typeof children === "string" ? (
          <text content={children} fg={tokens.colors.foreground} />
        ) : (
          children
        )}
      </box>
    </Box>
  );
}

export interface ContextMenuRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function ContextMenuRadioItem({
  value: _value,
  checked = false,
  children,
  onSelect,
  ...rest
}: ContextMenuRadioItemProps) {
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    context?.setOpen(false);
    onSelect?.();
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      onMouseUp={handleClick}
      {...rest}
    >
      <box flexDirection="row" alignItems="center" gap={1}>
        <text content={checked ? "●" : "○"} fg={tokens.colors.primary} />
        {typeof children === "string" ? (
          <text content={children} fg={tokens.colors.foreground} />
        ) : (
          children
        )}
      </box>
    </Box>
  );
}

export interface ContextMenuLabelProps extends BoxOptions {
  children: ReactNode;
}

export function ContextMenuLabel({ children, ...rest }: ContextMenuLabelProps) {
  const tokens = useTheme();
  return (
    <box paddingX={1} height={1} {...rest}>
      {typeof children === "string" ? (
        <text content={children} fg={tokens.colors.mutedForeground} />
      ) : (
        children
      )}
    </box>
  );
}

export interface ContextMenuSeparatorProps extends BoxOptions {}

export function ContextMenuSeparator(props: ContextMenuSeparatorProps) {
  const tokens = useTheme();
  return (
    <box
      height={1}
      width="100%"
      backgroundColor={tokens.colors.border}
      marginY={1}
      {...props}
    />
  );
}

export interface ContextMenuShortcutProps extends TextOptions {
  children: string;
}

export function ContextMenuShortcut({
  children,
  ...rest
}: ContextMenuShortcutProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}

export interface ContextMenuGroupProps extends BoxOptions {
  children: ReactNode;
}

export function ContextMenuGroup({ children, ...rest }: ContextMenuGroupProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}
