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

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null,
);

export interface DropdownMenuProps extends BoxOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...rest
}: DropdownMenuProps) {
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
    <DropdownMenuContext.Provider value={contextValue}>
      <box flexDirection="column" width={25} {...rest}>
        {children}
      </box>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function DropdownMenuTrigger({
  children,
  ...rest
}: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext);
  const tokens = useTheme();

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      height={3}
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

export interface DropdownMenuContentProps extends BoxOptions {
  children: ReactNode;
}

export function DropdownMenuContent({
  children,
  ...rest
}: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext);
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

export interface DropdownMenuItemProps extends BoxOptions {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled = false,
  ...rest
}: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext);
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

export interface DropdownMenuCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function DropdownMenuCheckboxItem({
  checked = false,
  children,
  onSelect,
  ...rest
}: DropdownMenuCheckboxItemProps) {
  const context = useContext(DropdownMenuContext);
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

export interface DropdownMenuRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function DropdownMenuRadioItem({
  value: _value,
  checked = false,
  children,
  onSelect,
  ...rest
}: DropdownMenuRadioItemProps) {
  const context = useContext(DropdownMenuContext);
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

export interface DropdownMenuLabelProps extends BoxOptions {
  children: ReactNode;
}

export function DropdownMenuLabel({
  children,
  ...rest
}: DropdownMenuLabelProps) {
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

export interface DropdownMenuSeparatorProps extends BoxOptions {}

export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
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

export interface DropdownMenuShortcutProps extends TextOptions {
  children: string;
}

export function DropdownMenuShortcut({
  children,
  ...rest
}: DropdownMenuShortcutProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}

export interface DropdownMenuGroupProps extends BoxOptions {
  children: ReactNode;
}

export function DropdownMenuGroup({
  children,
  ...rest
}: DropdownMenuGroupProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}
