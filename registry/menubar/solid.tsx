/** @jsxImportSource @opentui/solid */

import type { BoxOptions, KeyEvent, TextOptions } from "@opentui/core";
import { useKeyboard } from "@opentui/solid";
import {
  type Accessor,
  createContext,
  createSignal,
  type JSX,
  splitProps,
  useContext,
} from "solid-js";
import { useTheme } from "./use-theme";

interface MenubarContextValue {
  value: Accessor<string | null>;
  setValue: (value: string | null) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const MenubarContext = createContext<MenubarContextValue>();

export interface MenubarProps extends BoxOptions {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children?: JSX.Element;
}

export function Menubar(props: MenubarProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "children",
  ]);

  const [internalValue, setInternalValue] = createSignal<string | null>(
    local.defaultValue ?? null,
  );
  const value = () =>
    local.value !== undefined ? local.value : internalValue();
  const tokens = useTheme();

  const setValue = (next: string | null) => {
    if (local.value === undefined) setInternalValue(next);
    local.onValueChange?.(next);
  };

  const handleKeyPress = (key: KeyEvent) => {
    if (value() !== null && key.name === "escape") {
      setValue(null);
    }
  };

  useKeyboard(handleKeyPress);

  const contextValue: MenubarContextValue = { value, setValue };

  return (
    <MenubarContext.Provider value={contextValue}>
      <box
        flexDirection="row"
        alignItems="center"
        border
        borderStyle="single"
        borderColor={tokens().colors.border}
        backgroundColor={tokens().colors.surface}
        paddingX={1}
        height={3}
        {...rest}
      >
        {local.children}
      </box>
    </MenubarContext.Provider>
  );
}

interface MenubarMenuContextValue {
  value: string;
  isOpen: Accessor<boolean>;
  close: () => void;
}

const MenubarMenuContext = createContext<MenubarMenuContextValue>();

let nextMenuId = 0;

export interface MenubarMenuProps {
  value?: string;
  children?: JSX.Element;
}

export function MenubarMenu(props: MenubarMenuProps): JSX.Element {
  const menubar = useContext(MenubarContext);
  const menuValue = props.value ?? `menu-${++nextMenuId}`;
  const isOpen = () => menubar?.value() === menuValue;
  const close = () => menubar?.setValue(null);

  const menuContextValue: MenubarMenuContextValue = {
    value: menuValue,
    isOpen,
    close,
  };

  return (
    <MenubarMenuContext.Provider value={menuContextValue}>
      <box flexDirection="column">{props.children}</box>
    </MenubarMenuContext.Provider>
  );
}

export interface MenubarTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarTrigger(props: MenubarTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const menubar = useContext(MenubarContext);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const isOpen = () => menu?.isOpen() ?? false;

  const handleClick = () => {
    if (!menubar || !menu) return;
    menubar.setValue(isOpen() ? null : menu.value);
  };

  return (
    <Box
      paddingX={1}
      height={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor={isOpen() ? tokens().colors.primary : "transparent"}
      onMouseUp={handleClick}
      {...rest}
    >
      {typeof local.children === "string" ? (
        <text
          content={local.children}
          fg={
            isOpen() ? tokens().colors.background : tokens().colors.foreground
          }
        />
      ) : (
        local.children
      )}
    </Box>
  );
}

export interface MenubarContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarContent(props: MenubarContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  return (
    <box
      flexDirection="column"
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      paddingY={1}
      width={25}
      visible={menu?.isOpen() ?? true}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export interface MenubarItemProps extends BoxOptions {
  children?: JSX.Element;
  onSelect?: () => void;
  disabled?: boolean;
}

export function MenubarItem(props: MenubarItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "onSelect", "disabled"]);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    if (local.disabled) return;
    menu?.close();
    local.onSelect?.();
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
      {typeof local.children === "string" ? (
        <text
          content={local.children}
          fg={
            local.disabled
              ? tokens().colors.mutedForeground
              : tokens().colors.foreground
          }
        />
      ) : (
        local.children
      )}
    </Box>
  );
}

export interface MenubarCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function MenubarCheckboxItem(
  props: MenubarCheckboxItemProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["checked", "children", "onSelect"]);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    menu?.close();
    local.onSelect?.();
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
        <text
          content={local.checked ? "✓" : " "}
          fg={tokens().colors.primary}
        />
        {typeof local.children === "string" ? (
          <text content={local.children} fg={tokens().colors.foreground} />
        ) : (
          local.children
        )}
      </box>
    </Box>
  );
}

export interface MenubarRadioGroupProps extends BoxOptions {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: JSX.Element;
}

export function MenubarRadioGroup(props: MenubarRadioGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}

export interface MenubarRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function MenubarRadioItem(props: MenubarRadioItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "checked",
    "children",
    "onSelect",
  ]);
  const menu = useContext(MenubarMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    menu?.close();
    local.onSelect?.();
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
        <text
          content={local.checked ? "●" : "○"}
          fg={tokens().colors.primary}
        />
        {typeof local.children === "string" ? (
          <text content={local.children} fg={tokens().colors.foreground} />
        ) : (
          local.children
        )}
      </box>
    </Box>
  );
}

export interface MenubarSeparatorProps extends BoxOptions {}

export function MenubarSeparator(props: MenubarSeparatorProps): JSX.Element {
  const tokens = useTheme();
  return (
    <box
      height={1}
      width="100%"
      backgroundColor={tokens().colors.border}
      marginY={1}
      {...props}
    />
  );
}

export interface MenubarShortcutProps extends TextOptions {
  children?: string;
}

export function MenubarShortcut(props: MenubarShortcutProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();
  return (
    <text
      content={local.children ?? ""}
      fg={tokens().colors.mutedForeground}
      {...rest}
    />
  );
}

export interface MenubarGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarGroup(props: MenubarGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}

export interface MenubarSubProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarSub(props: MenubarSubProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}

export interface MenubarSubTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarSubTrigger(props: MenubarSubTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
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
      {typeof local.children === "string" ? (
        <text content={local.children} fg={tokens().colors.foreground} />
      ) : (
        local.children
      )}
      <text content="▶" fg={tokens().colors.mutedForeground} />
    </box>
  );
}

export interface MenubarSubContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function MenubarSubContent(props: MenubarSubContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();
  return (
    <box
      flexDirection="column"
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      paddingY={1}
      {...rest}
    >
      {local.children}
    </box>
  );
}
