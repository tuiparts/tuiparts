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

interface SelectItemData {
  value: string;
  label: string;
}

interface SelectContextValue {
  value?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectValue: (val: string, label: string) => void;
  placeholder?: string;
  displayLabel?: string;
  activeIndex: number;
  setActiveIndex: (index: number | ((prev: number) => number)) => void;
  items: SelectItemData[];
  registerItem: (item: SelectItemData) => () => void;
  disabled?: boolean;
}

const Box = (props: BoxOptions & { children?: ReactNode }) => (
  <box {...props} />
);

const SelectContext = createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({
  value: controlledValue,
  defaultValue,
  placeholder = "Select...",
  disabled = false,
  onValueChange,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<SelectItemData[]>([]);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const registerItem = useCallback((item: SelectItemData) => {
    setItems((prev) => {
      if (prev.some((i) => i.value === item.value)) return prev;
      return [...prev, item];
    });
    return () => {
      setItems((prev) => prev.filter((i) => i.value !== item.value));
    };
  }, []);

  const selectValue = useCallback(
    (val: string, label: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      setSelectedLabel(label);
      onValueChange?.(val);
      setOpen(false);
    },
    [isControlled, onValueChange],
  );

  const handleKeyPress = useCallback(
    (key: KeyEvent) => {
      if (disabled) return;
      if (!open) {
        if (
          key.name === "return" ||
          key.name === "enter" ||
          key.name === "space"
        ) {
          setOpen(true);
        }
        return;
      }

      if (key.name === "escape") {
        setOpen(false);
        return;
      }

      if (key.name === "up") {
        setActiveIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (key.name === "down") {
        setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));
        return;
      }

      if (
        key.name === "return" ||
        key.name === "enter" ||
        key.name === "space"
      ) {
        const active = items[activeIndex];
        if (active) {
          selectValue(active.value, active.label);
        }
      }
    },
    [disabled, open, activeIndex, items, selectValue],
  );

  useKeyboard(handleKeyPress);

  const contextValue = useMemo<SelectContextValue>(
    () => ({
      value,
      open,
      setOpen,
      selectValue,
      placeholder,
      displayLabel: selectedLabel,
      activeIndex,
      setActiveIndex,
      items,
      registerItem,
      disabled,
    }),
    [
      value,
      open,
      selectValue,
      placeholder,
      selectedLabel,
      activeIndex,
      items,
      registerItem,
      disabled,
    ],
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <box flexDirection="column">{children}</box>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends BoxOptions {
  children?: ReactNode;
}

export function SelectTrigger({ children, ...rest }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  const tokens = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      paddingX={1}
      height={3}
      onMouseDown={() => {
        if (!context?.disabled) {
          context?.setOpen(!context.open);
        }
      }}
      {...rest}
    >
      {children ?? <SelectValue />}
      <text
        content={context?.open ? "▲" : "▼"}
        fg={tokens.colors.mutedForeground}
      />
    </Box>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = useContext(SelectContext);
  const tokens = useTheme();

  const label =
    context?.displayLabel ??
    context?.items.find((i) => i.value === context.value)?.label ??
    context?.value ??
    placeholder ??
    context?.placeholder ??
    "Select...";

  const isPlaceholder = !context?.value && !context?.displayLabel;

  return (
    <text
      content={label}
      fg={
        isPlaceholder ? tokens.colors.mutedForeground : tokens.colors.foreground
      }
    />
  );
}

export interface SelectContentProps extends BoxOptions {
  children: ReactNode;
}

export function SelectContent({ children, ...rest }: SelectContentProps) {
  const context = useContext(SelectContext);
  const tokens = useTheme();

  if (!context?.open) return null;

  return (
    <box
      flexDirection="column"
      border
      borderStyle="single"
      borderColor={tokens.colors.border}
      backgroundColor={tokens.colors.surface}
      {...rest}
    >
      {children}
    </box>
  );
}

export interface SelectItemProps extends BoxOptions {
  value: string;
  children: ReactNode;
}

export function SelectItem({ value, children, ...rest }: SelectItemProps) {
  const context = useContext(SelectContext);
  const tokens = useTheme();
  const label = typeof children === "string" ? children : value;

  useMemo(() => {
    return context?.registerItem({ value, label });
  }, [context, value, label]);

  const isSelected = context?.value === value;
  const itemIndex = context?.items.findIndex((i) => i.value === value) ?? -1;
  const isHighlighted = context?.activeIndex === itemIndex;

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor={isHighlighted ? tokens.colors.primary : "transparent"}
      onMouseDown={() => context?.selectValue(value, label)}
      {...rest}
    >
      <text
        content={`${isSelected ? "✓ " : "  "}${label}`}
        fg={
          isHighlighted
            ? tokens.colors.primaryForeground
            : tokens.colors.foreground
        }
      />
    </Box>
  );
}

export interface SelectGroupProps extends BoxOptions {
  children: ReactNode;
}

export function SelectGroup({ children, ...rest }: SelectGroupProps) {
  return (
    <box flexDirection="column" {...rest}>
      {children}
    </box>
  );
}

export interface SelectLabelProps {
  children: string;
}

export function SelectLabel({ children }: SelectLabelProps) {
  const tokens = useTheme();
  return (
    <box paddingX={1} height={1}>
      <text content={children} fg={tokens.colors.mutedForeground} />
    </box>
  );
}

export interface SelectSeparatorProps extends BoxOptions {}

export function SelectSeparator(props: SelectSeparatorProps) {
  const tokens = useTheme();
  return (
    <box height={1} {...props}>
      <text content="─" fg={tokens.colors.border} />
    </box>
  );
}
