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

interface CommandContextValue {
  search: Accessor<string>;
  setSearch: (search: string) => void;
  matchesSearch: (text: string) => boolean;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const CommandContext = createContext<CommandContextValue>({
  search: () => "",
  setSearch: () => {},
  matchesSearch: () => true,
});

export interface CommandProps extends BoxOptions {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: JSX.Element;
}

export function Command(props: CommandProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "onValueChange",
    "children",
  ]);
  const [search, setSearch] = createSignal("");
  const tokens = useTheme();

  const handleKeyPress = (key: KeyEvent) => {
    if (key.name === "backspace") {
      setSearch((prev) => prev.slice(0, -1));
      return;
    }
    if (key.name === "escape") {
      setSearch("");
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

  const contextValue: CommandContextValue = {
    search,
    setSearch,
    matchesSearch,
  };

  return (
    <CommandContext.Provider value={contextValue}>
      <box
        flexDirection="column"
        border
        borderStyle="single"
        borderColor={tokens().colors.border}
        backgroundColor={tokens().colors.surface}
        width={40}
        {...rest}
      >
        {local.children}
      </box>
    </CommandContext.Provider>
  );
}

export interface CommandInputProps extends BoxOptions {
  placeholder?: string;
  textOptions?: TextOptions;
}

export function CommandInput(props: CommandInputProps): JSX.Element {
  const [local, rest] = splitProps(props, ["placeholder", "textOptions"]);
  const context = useContext(CommandContext);
  const tokens = useTheme();

  const placeholder = () => local.placeholder ?? "Type a command or search...";
  const isBlank = () => (context?.search().length ?? 0) === 0;
  const content = () =>
    isBlank() ? `⌕ ${placeholder()}` : `⌕ ${context?.search()}`;

  return (
    <box
      flexDirection="row"
      paddingX={1}
      height={2}
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      alignItems="center"
      {...rest}
    >
      <text
        content={content()}
        fg={
          isBlank()
            ? tokens().colors.mutedForeground
            : tokens().colors.foreground
        }
        {...local.textOptions}
      />
    </box>
  );
}

export interface CommandListProps extends BoxOptions {
  children?: JSX.Element;
}

export function CommandList(props: CommandListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" paddingX={1} paddingY={1} {...rest}>
      {local.children}
    </box>
  );
}

export interface CommandEmptyProps extends BoxOptions {
  children?: JSX.Element;
  textOptions?: TextOptions;
}

export function CommandEmpty(props: CommandEmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "textOptions"]);
  const context = useContext(CommandContext);
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
        <text
          content={local.children}
          fg={tokens().colors.mutedForeground}
          {...local.textOptions}
        />
      ) : (
        (local.children ?? (
          <text
            content="No results found."
            fg={tokens().colors.mutedForeground}
            {...local.textOptions}
          />
        ))
      )}
    </box>
  );
}

export interface CommandGroupProps extends BoxOptions {
  heading?: string;
  children?: JSX.Element;
  textOptions?: TextOptions;
}

export function CommandGroup(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "heading",
    "children",
    "textOptions",
  ]);
  const tokens = useTheme();

  return (
    <box flexDirection="column" marginBottom={1} {...rest}>
      {local.heading ? (
        <box paddingX={1} marginBottom={0}>
          <text
            content={local.heading}
            fg={tokens().colors.mutedForeground}
            {...local.textOptions}
          />
        </box>
      ) : null}
      {local.children}
    </box>
  );
}

export interface CommandItemProps extends BoxOptions {
  value?: string;
  selected?: boolean;
  onSelect?: () => void;
  children?: JSX.Element;
}

export function CommandItem(props: CommandItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "selected",
    "onSelect",
    "children",
  ]);
  const context = useContext(CommandContext);
  const tokens = useTheme();

  const label = () =>
    typeof local.children === "string" ? local.children : (local.value ?? "");
  const visible = () => context?.matchesSearch(label()) ?? true;

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor={local.selected ? tokens().colors.primary : "transparent"}
      visible={visible()}
      onMouseUp={() => local.onSelect?.()}
      {...rest}
    >
      {typeof local.children === "string" ? (
        <text
          content={local.children}
          fg={
            local.selected
              ? tokens().colors.background
              : tokens().colors.foreground
          }
        />
      ) : (
        local.children
      )}
    </Box>
  );
}

export interface CommandShortcutProps extends TextOptions {
  children: string;
}

export function CommandShortcut(props: CommandShortcutProps): JSX.Element {
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

export interface CommandSeparatorProps extends BoxOptions {}

export function CommandSeparator(props: CommandSeparatorProps): JSX.Element {
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
