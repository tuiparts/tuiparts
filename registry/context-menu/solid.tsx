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

interface ContextMenuContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const ContextMenuContext = createContext<ContextMenuContextValue>();

export interface ContextMenuProps extends BoxOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function ContextMenu(props: ContextMenuProps): JSX.Element {
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

  const contextValue: ContextMenuContextValue = { open, setOpen };

  return (
    <ContextMenuContext.Provider value={contextValue}>
      <box flexDirection="column" width={30} {...rest}>
        {local.children}
      </box>
    </ContextMenuContext.Provider>
  );
}

export interface ContextMenuTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function ContextMenuTrigger(
  props: ContextMenuTriggerProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(ContextMenuContext);
  const tokens = useTheme();

  return (
    <Box
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      paddingY={1}
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

export interface ContextMenuContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function ContextMenuContent(
  props: ContextMenuContentProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(ContextMenuContext);
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

export interface ContextMenuItemProps extends BoxOptions {
  children?: JSX.Element;
  onSelect?: () => void;
  disabled?: boolean;
}

export function ContextMenuItem(props: ContextMenuItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "onSelect", "disabled"]);
  const context = useContext(ContextMenuContext);
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

export interface ContextMenuCheckboxItemProps extends BoxOptions {
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function ContextMenuCheckboxItem(
  props: ContextMenuCheckboxItemProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["checked", "children", "onSelect"]);
  const context = useContext(ContextMenuContext);
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

export interface ContextMenuRadioItemProps extends BoxOptions {
  value: string;
  checked?: boolean;
  children?: JSX.Element;
  onSelect?: () => void;
}

export function ContextMenuRadioItem(
  props: ContextMenuRadioItemProps,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "checked",
    "children",
    "onSelect",
  ]);
  const context = useContext(ContextMenuContext);
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

export interface ContextMenuLabelProps extends BoxOptions {
  children?: JSX.Element;
}

export function ContextMenuLabel(props: ContextMenuLabelProps): JSX.Element {
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

export interface ContextMenuSeparatorProps extends BoxOptions {}

export function ContextMenuSeparator(
  props: ContextMenuSeparatorProps,
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

export interface ContextMenuShortcutProps extends TextOptions {
  children?: string;
}

export function ContextMenuShortcut(
  props: ContextMenuShortcutProps,
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

export interface ContextMenuGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export function ContextMenuGroup(props: ContextMenuGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}
