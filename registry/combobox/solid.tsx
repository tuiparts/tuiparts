/** @jsxImportSource @opentui/solid */

import type { BoxOptions, KeyEvent } from "@opentui/core";
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

interface ComboboxContextValue {
  value: Accessor<string>;
  setValue: (value: string) => void;
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  search: Accessor<string>;
  setSearch: (search: string) => void;
  matchesSearch: (text: string) => boolean;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const ComboboxContext = createContext<ComboboxContextValue>();

export interface ComboboxProps extends BoxOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: JSX.Element;
}

export function Combobox(props: ComboboxProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "open",
    "defaultOpen",
    "onOpenChange",
    "children",
  ]);

  const [internalValue, setInternalValue] = createSignal(
    local.defaultValue ?? "",
  );
  const [internalOpen, setInternalOpen] = createSignal(
    local.defaultOpen ?? false,
  );
  const [search, setSearch] = createSignal("");

  const value = () =>
    local.value !== undefined ? local.value : internalValue();
  const open = () => (local.open !== undefined ? local.open : internalOpen());

  const setValue = (next: string) => {
    if (local.value === undefined) setInternalValue(next);
    local.onValueChange?.(next);
  };

  const setOpen = (next: boolean) => {
    if (local.open === undefined) setInternalOpen(next);
    local.onOpenChange?.(next);
  };

  const handleKeyPress = (key: KeyEvent) => {
    if (!open()) return;
    if (key.name === "escape") {
      setOpen(false);
      return;
    }
    if (key.name === "backspace") {
      setSearch((prev) => prev.slice(0, -1));
      return;
    }
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      setSearch((prev) => prev + key.sequence);
    }
  };

  useKeyboard(handleKeyPress);

  const matchesSearch = (text: string) => {
    const q = search();
    if (!q) return true;
    return text.toLowerCase().includes(q.toLowerCase());
  };

  const contextValue: ComboboxContextValue = {
    value,
    setValue,
    open,
    setOpen,
    search,
    setSearch,
    matchesSearch,
  };

  return (
    <ComboboxContext.Provider value={contextValue}>
      <box flexDirection="column" width={30} {...rest}>
        {local.children}
      </box>
    </ComboboxContext.Provider>
  );
}

export interface ComboboxTriggerProps extends BoxOptions {
  placeholder?: string;
  children?: JSX.Element;
}

export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["placeholder", "children"]);
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  const placeholder = () => local.placeholder ?? "Select an option...";
  const hasValue = () => (context?.value().length ?? 0) > 0;
  const triggerText = () =>
    hasValue() ? (context?.value() ?? "") : placeholder();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      paddingX={1}
      height={3}
      onMouseUp={() => context?.setOpen(!context.open())}
      {...rest}
    >
      {local.children ?? (
        <text
          content={triggerText()}
          fg={
            hasValue()
              ? tokens().colors.foreground
              : tokens().colors.mutedForeground
          }
        />
      )}
      <text
        content={context?.open() ? "▲" : "▼"}
        fg={tokens().colors.mutedForeground}
      />
    </Box>
  );
}

export interface ComboboxContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function ComboboxContent(props: ComboboxContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(ComboboxContext);
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

export interface ComboboxInputProps extends BoxOptions {
  placeholder?: string;
}

export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
  const [local, rest] = splitProps(props, ["placeholder"]);
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  const placeholder = () => local.placeholder ?? "Search...";
  const isBlank = () => (context?.search().length ?? 0) === 0;
  const content = () =>
    isBlank() ? `⌕ ${placeholder()}` : `⌕ ${context?.search()}`;

  return (
    <box flexDirection="row" height={1} marginBottom={1} {...rest}>
      <text
        content={content()}
        fg={
          isBlank()
            ? tokens().colors.mutedForeground
            : tokens().colors.foreground
        }
      />
    </box>
  );
}

export interface ComboboxListProps extends BoxOptions {
  children?: JSX.Element;
}

export function ComboboxList(props: ComboboxListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}

export interface ComboboxEmptyProps extends BoxOptions {
  children?: JSX.Element;
}

export function ComboboxEmpty(props: ComboboxEmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  const isVisible = () => (context?.search().length ?? 0) > 0;

  return (
    <box
      height={2}
      alignItems="center"
      justifyContent="center"
      paddingX={1}
      visible={isVisible()}
      {...rest}
    >
      {typeof local.children === "string" ? (
        <text content={local.children} fg={tokens().colors.mutedForeground} />
      ) : (
        (local.children ?? (
          <text
            content="No results found."
            fg={tokens().colors.mutedForeground}
          />
        ))
      )}
    </box>
  );
}

export interface ComboboxItemProps extends BoxOptions {
  value: string;
  children?: JSX.Element;
  onSelect?: (value: string) => void;
}

export function ComboboxItem(props: ComboboxItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "children", "onSelect"]);
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  const label = () =>
    typeof local.children === "string" ? local.children : local.value;
  const visible = () => context?.matchesSearch(label()) ?? true;
  const isSelected = () => context?.value() === local.value;

  const handleClick = () => {
    context?.setValue(local.value);
    context?.setOpen(false);
    local.onSelect?.(local.value);
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor="transparent"
      visible={visible()}
      onMouseUp={handleClick}
      {...rest}
    >
      {typeof local.children === "string" ? (
        <text content={local.children} fg={tokens().colors.foreground} />
      ) : (
        local.children
      )}
      <text content={isSelected() ? "✓" : " "} fg={tokens().colors.primary} />
    </Box>
  );
}
