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

interface MenubarContextValue {
  value: string | null;
  setValue: (value: string | null) => void;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const MenubarContext = createContext<MenubarContextValue | null>(null);

export interface MenubarProps extends BoxOptions {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: ReactNode;
}

export function Menubar({
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  children,
  ...rest
}: MenubarProps) {
  const [internalValue, setInternalValue] = useState<string | null>(
    defaultValue,
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const tokens = useTheme();

  const setValue = useCallback(
    (next: string | null) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const handleKeyPress = useCallback(
    (key: KeyEvent) => {
      if (value !== null && key.name === "escape") {
        setValue(null);
      }
    },
    [value, setValue],
  );

  useKeyboard(handleKeyPress);

  const contextValue = useMemo(() => ({ value, setValue }), [value, setValue]);

  return (
    <MenubarContext.Provider value={contextValue}>
      <box
        flexDirection="row"
        alignItems="center"
        border
        borderStyle="single"
        borderColor={tokens.colors.border}
        backgroundColor={tokens.colors.surface}
        paddingX={1}
        height={3}
        {...rest}
      >
        {children}
      </box>
    </MenubarContext.Provider>
  );
}

interface MenubarMenuContextValue {
  value: string;
  isOpen: boolean;
  close: () => void;
}

const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);

export interface MenubarMenuProps {
  value?: string;
  children: ReactNode;
}

let nextMenuId = 0;

export function MenubarMenu({
  value: explicitValue,
  children,
}: MenubarMenuProps) {
  const menubar = useContext(MenubarContext);
  const [fallbackId] = useState(() => `menu-${++nextMenuId}`);
  const menuValue = explicitValue ?? fallbackId;
  const isOpen = menubar?.value === menuValue;

  const close = useCallback(() => {
    menubar?.setValue(null);
  }, [menubar]);

  const menuContextValue = useMemo(
    () => ({ value: menuValue, isOpen, close }),
    [menuValue, isOpen, close],
  );

  return (
    <MenubarMenuContext.Provider value={menuContextValue}>
      <box flexDirection="column">{children}</box>
    </MenubarMenuContext.Provider>
  );
}

export interface MenubarTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarTrigger({ children, ...rest }: MenubarTriggerProps) {
  const menubar = useContext(MenubarContext);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const isOpen = menu?.isOpen ?? false;

  const handleClick = () => {
    if (!menubar || !menu) return;
    menubar.setValue(isOpen ? null : menu.value);
  };

  return (
    <Box
      paddingX={1}
      height={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor={isOpen ? tokens.colors.primary : "transparent"}
      onMouseUp={handleClick}
      {...rest}
    >
      {typeof children === "string" ? (
        <text
          content={children}
          fg={isOpen ? tokens.colors.background : tokens.colors.foreground}
        />
      ) : (
        children
      )}
    </Box>
  );
}

export interface MenubarContentProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarContent({ children, ...rest }: MenubarContentProps) {
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  if (menu && !menu.isOpen) {
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
      width={25}
      {...rest}
    >
      {children}
    </box>
  );
}

export interface MenubarItemProps extends BoxOptions {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export function MenubarItem({
  children,
  onSelect,
  disabled = false,
  ...rest
}: MenubarItemProps) {
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    if (disabled) return;
    menu?.close();
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

export interface MenubarCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function MenubarCheckboxItem({
  checked = false,
  children,
  onSelect,
  ...rest
}: MenubarCheckboxItemProps) {
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    menu?.close();
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

export interface MenubarRadioGroupProps extends BoxOptions {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function MenubarRadioGroup({
  children,
  ...rest
}: MenubarRadioGroupProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}

export interface MenubarRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children: ReactNode;
  onSelect?: () => void;
}

export function MenubarRadioItem({
  value: _value,
  checked = false,
  children,
  onSelect,
  ...rest
}: MenubarRadioItemProps) {
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    menu?.close();
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

export interface MenubarSeparatorProps extends BoxOptions {}

export function MenubarSeparator(props: MenubarSeparatorProps) {
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

export interface MenubarShortcutProps extends TextOptions {
  children: string;
}

export function MenubarShortcut({ children, ...rest }: MenubarShortcutProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}

export interface MenubarGroupProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarGroup({ children, ...rest }: MenubarGroupProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}

export interface MenubarSubProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarSub({ children, ...rest }: MenubarSubProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}

export interface MenubarSubTriggerProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarSubTrigger({
  children,
  ...rest
}: MenubarSubTriggerProps) {
  const tokens = useTheme();
  return (
    <box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      {...rest}
    >
      {typeof children === "string" ? (
        <text content={children} fg={tokens.colors.foreground} />
      ) : (
        children
      )}
      <text content="▶" fg={tokens.colors.mutedForeground} />
    </box>
  );
}

export interface MenubarSubContentProps extends BoxOptions {
  children: ReactNode;
}

export function MenubarSubContent({
  children,
  ...rest
}: MenubarSubContentProps) {
  const tokens = useTheme();
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
