/** @jsxImportSource @opentui/react */

import type { BoxOptions, KeyEvent } from "@opentui/core";
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

interface ComboboxContextValue {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  matchesSearch: (text: string) => boolean;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

export interface ComboboxProps extends BoxOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Combobox({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  ...rest
}: ComboboxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");

  const isControlledVal = controlledValue !== undefined;
  const isControlledOpen = controlledOpen !== undefined;

  const value = isControlledVal ? controlledValue : internalValue;
  const open = isControlledOpen ? controlledOpen : internalOpen;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlledVal) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlledVal, onValueChange],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlledOpen) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlledOpen, onOpenChange],
  );

  const handleKeyPress = useCallback(
    (key: KeyEvent) => {
      if (!open) return;
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
    },
    [open, setOpen],
  );

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
      value,
      setValue,
      open,
      setOpen,
      search,
      setSearch,
      matchesSearch,
    }),
    [value, setValue, open, setOpen, search, matchesSearch],
  );

  return (
    <ComboboxContext.Provider value={contextValue}>
      <box flexDirection="column" width={30} {...rest}>
        {children}
      </box>
    </ComboboxContext.Provider>
  );
}

export interface ComboboxTriggerProps extends BoxOptions {
  placeholder?: string;
  children?: ReactNode;
}

export function ComboboxTrigger({
  placeholder = "Select an option...",
  children,
  ...rest
}: ComboboxTriggerProps) {
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      paddingX={1}
      height={3}
      onMouseUp={() => context?.setOpen(!context.open)}
      {...rest}
    >
      {children ?? (
        <text
          content={context?.value ? context.value : placeholder}
          fg={
            context?.value
              ? tokens.colors.foreground
              : tokens.colors.mutedForeground
          }
        />
      )}
      <text
        content={context?.open ? "▲" : "▼"}
        fg={tokens.colors.mutedForeground}
      />
    </Box>
  );
}

export interface ComboboxContentProps extends BoxOptions {
  children: ReactNode;
}

export function ComboboxContent({ children, ...rest }: ComboboxContentProps) {
  const context = useContext(ComboboxContext);
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

export interface ComboboxInputProps extends BoxOptions {
  placeholder?: string;
}

export function ComboboxInput({
  placeholder = "Search...",
  ...rest
}: ComboboxInputProps) {
  const context = useContext(ComboboxContext);
  const tokens = useTheme();
  const search = context?.search ?? "";
  const isBlank = search.length === 0;

  return (
    <box flexDirection="row" height={1} marginBottom={1} {...rest}>
      <text
        content={isBlank ? `⌕ ${placeholder}` : `⌕ ${search}`}
        fg={isBlank ? tokens.colors.mutedForeground : tokens.colors.foreground}
      />
    </box>
  );
}

export interface ComboboxListProps extends BoxOptions {
  children: ReactNode;
}

export function ComboboxList({ children, ...rest }: ComboboxListProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}

export interface ComboboxEmptyProps extends BoxOptions {
  children?: ReactNode;
}

export function ComboboxEmpty({
  children = "No results found.",
  ...rest
}: ComboboxEmptyProps) {
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  if (!context?.search) return null;

  return (
    <box
      height={2}
      alignItems="center"
      justifyContent="center"
      paddingX={1}
      {...rest}
    >
      {typeof children === "string" ? (
        <text content={children} fg={tokens.colors.mutedForeground} />
      ) : (
        children
      )}
    </box>
  );
}

export interface ComboboxItemProps extends BoxOptions {
  value: string;
  children: ReactNode;
  onSelect?: (value: string) => void;
}

export function ComboboxItem({
  value,
  children,
  onSelect,
  ...rest
}: ComboboxItemProps) {
  const context = useContext(ComboboxContext);
  const tokens = useTheme();

  const label = typeof children === "string" ? children : value;
  if (context && !context.matchesSearch(label)) {
    return null;
  }

  const isSelected = context?.value === value;

  const handleClick = () => {
    context?.setValue(value);
    context?.setOpen(false);
    onSelect?.(value);
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
        <text content={children} fg={tokens.colors.foreground} />
      ) : (
        children
      )}
      <text content={isSelected ? "✓" : " "} fg={tokens.colors.primary} />
    </Box>
  );
}
