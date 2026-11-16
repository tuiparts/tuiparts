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

interface DropdownMenuContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const DropdownMenuContext = createContext<DropdownMenuContextValue>();

export interface DropdownMenuProps extends BoxOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "open",
    "defaultOpen",
    "onOpenChange",
    "children",
  ]);

  const [internalOpen, setInternalOpen] = createSignal(
    local.defaultOpen ?? false,
  );
  const open = () => (local.open !== undefined ? local.open : internalOpen());

  const setOpen = (next: boolean) => {
    if (local.open === undefined) setInternalOpen(next);
    local.onOpenChange?.(next);
  };

  const handleKeyPress = (key: KeyEvent) => {
    if (open() && key.name === "escape") {
      setOpen(false);
    }
  };

  useKeyboard(handleKeyPress);

  const contextValue: DropdownMenuContextValue = { open, setOpen };

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <box flexDirection="column" width={25} {...rest}>
        {local.children}
      </box>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function DropdownMenuTrigger(
  props: DropdownMenuTriggerProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(DropdownMenuContext);
  const tokens = useTheme();

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      height={3}
      alignItems="center"
      justifyContent="center"
      onMouseUp={() => context?.setOpen(!context.open())}
      {...rest}
    >
      {typeof local.children === "string" ? (
        <text content={local.children} fg={tokens().colors.foreground} />
      ) : (
        local.children
      )}
    </Box>
  );
}

export interface DropdownMenuContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function DropdownMenuContent(
  props: DropdownMenuContentProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(DropdownMenuContext);
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
      visible={context?.open() ?? true}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export interface DropdownMenuItemProps extends BoxOptions {
  children?: JSX.Element;
  onSelect?: () => void;
  disabled?: boolean;
}

export function DropdownMenuItem(props: DropdownMenuItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "onSelect", "disabled"]);
  const context = useContext(DropdownMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    if (local.disabled) return;
    context?.setOpen(false);
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

export interface DropdownMenuCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function DropdownMenuCheckboxItem(
  props: DropdownMenuCheckboxItemProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["checked", "children", "onSelect"]);
  const context = useContext(DropdownMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    context?.setOpen(false);
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

export interface DropdownMenuRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function DropdownMenuRadioItem(
  props: DropdownMenuRadioItemProps,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "checked",
    "children",
    "onSelect",
  ]);
  const context = useContext(DropdownMenuContext);
  const tokens = useTheme();

  const handleClick = () => {
    context?.setOpen(false);
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

export interface DropdownMenuLabelProps extends BoxOptions {
  children?: JSX.Element;
}

export function DropdownMenuLabel(props: DropdownMenuLabelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const tokens = useTheme();

  return (
    <box paddingX={1} height={1} {...rest}>
      {typeof local.children === "string" ? (
        <text content={local.children} fg={tokens().colors.mutedForeground} />
      ) : (
        local.children
      )}
    </box>
  );
}

export interface DropdownMenuSeparatorProps extends BoxOptions {}

export function DropdownMenuSeparator(
  props: DropdownMenuSeparatorProps,
): JSX.Element {
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

export interface DropdownMenuShortcutProps extends TextOptions {
  children?: string;
}

export function DropdownMenuShortcut(
  props: DropdownMenuShortcutProps,
): JSX.Element {
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

export interface DropdownMenuGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export function DropdownMenuGroup(props: DropdownMenuGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}
