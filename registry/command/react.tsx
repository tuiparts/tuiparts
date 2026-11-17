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

interface CommandContextValue {
  search: string;
  setSearch: (search: string) => void;
  matchesSearch: (text: string) => boolean;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const CommandContext = createContext<CommandContextValue>({
  search: "",
  setSearch: () => {},
  matchesSearch: () => true,
});

export interface CommandProps extends BoxOptions {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Command({
  value: _value,
  onValueChange: _onValueChange,
  children,
  ...rest
}: CommandProps) {
  const [search, setSearch] = useState("");
  const tokens = useTheme();

  const handleKeyPress = useCallback((key: KeyEvent) => {
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
  }, []);

  useKeyboard(handleKeyPress);

  const matchesSearch = useCallback(
    (text: string) => {
      if (!search) return true;
      return text.toLowerCase().includes(search.toLowerCase());
    },
    [search],
  );

  const contextValue = useMemo(
    () => ({
      search,
      setSearch,
      matchesSearch,
    }),
    [search, matchesSearch],
  );

  return (
    <CommandContext.Provider value={contextValue}>
      <box
        flexDirection="column"
        border
        borderStyle="single"
        borderColor={tokens.colors.border}
        backgroundColor={tokens.colors.surface}
        width={40}
        {...rest}
      >
        {children}
      </box>
    </CommandContext.Provider>
  );
}

export interface CommandInputProps extends BoxOptions {
  placeholder?: string;
  textOptions?: TextOptions;
}

export function CommandInput({
  placeholder = "Type a command or search...",
  textOptions,
  ...rest
}: CommandInputProps) {
  const { search } = useContext(CommandContext);
  const tokens = useTheme();

  const isBlank = search.length === 0;

  return (
    <box
      flexDirection="row"
      paddingX={1}
      height={2}
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      alignItems="center"
      {...rest}
    >
      <text
        content={isBlank ? `⌕ ${placeholder}` : `⌕ ${search}`}
        fg={isBlank ? tokens.colors.mutedForeground : tokens.colors.foreground}
        {...textOptions}
      />
    </box>
  );
}

export interface CommandListProps extends BoxOptions {
  children: ReactNode;
}

export function CommandList({ children, ...rest }: CommandListProps) {
  return (
    <box flexDirection="column" paddingX={1} paddingY={1} {...rest}>
      {children}
    </box>
  );
}

export interface CommandEmptyProps extends BoxOptions {
  children?: ReactNode;
  textOptions?: TextOptions;
}

export function CommandEmpty({
  children = "No results found.",
  textOptions,
  ...rest
}: CommandEmptyProps) {
  const { search } = useContext(CommandContext);
  const tokens = useTheme();

  if (!search) return null;

  return (
    <box
      height={2}
      alignItems="center"
      justifyContent="center"
      paddingX={1}
      {...rest}
    >
      {typeof children === "string" ? (
        <text
          content={children}
          fg={tokens.colors.mutedForeground}
          {...textOptions}
        />
      ) : (
        children
      )}
    </box>
  );
}

export interface CommandGroupProps extends BoxOptions {
  heading?: string;
  children: ReactNode;
  textOptions?: TextOptions;
}

export function CommandGroup({
  heading,
  children,
  textOptions,
  ...rest
}: CommandGroupProps) {
  const tokens = useTheme();

  return (
    <box flexDirection="column" marginBottom={1} {...rest}>
      {heading ? (
        <box paddingX={1} marginBottom={0}>
          <text
            content={heading}
            fg={tokens.colors.mutedForeground}
            {...textOptions}
          />
        </box>
      ) : null}
      {children}
    </box>
  );
}

export interface CommandItemProps extends BoxOptions {
  value?: string;
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
}

export function CommandItem({
  value,
  selected = false,
  onSelect,
  children,
  ...rest
}: CommandItemProps) {
  const { matchesSearch } = useContext(CommandContext);
  const tokens = useTheme();

  const label = typeof children === "string" ? children : (value ?? "");
  if (!matchesSearch(label)) {
    return null;
  }

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor={selected ? tokens.colors.primary : "transparent"}
      onMouseUp={() => onSelect?.()}
      {...rest}
    >
      {typeof children === "string" ? (
        <text
          content={children}
          fg={selected ? tokens.colors.background : tokens.colors.foreground}
        />
      ) : (
        children
      )}
    </Box>
  );
}

export interface CommandShortcutProps extends TextOptions {
  children: string;
}

export function CommandShortcut({ children, ...rest }: CommandShortcutProps) {
  const tokens = useTheme();
  return (
    <text content={children} fg={tokens.colors.mutedForeground} {...rest} />
  );
}

export interface CommandSeparatorProps extends BoxOptions {}

export function CommandSeparator(props: CommandSeparatorProps) {
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
