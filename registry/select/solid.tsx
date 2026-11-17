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

interface SelectItemData {
  value: string;
  label: string;
}

interface SelectContextValue {
  value: Accessor<string | undefined>;
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
  selectValue: (val: string, label: string) => void;
  placeholder: string;
  displayLabel: Accessor<string | undefined>;
  activeIndex: Accessor<number>;
  setActiveIndex: (index: number | ((prev: number) => number)) => void;
  items: Accessor<SelectItemData[]>;
  registerItem: (item: SelectItemData) => void;
  disabled: Accessor<boolean>;
}

const Box = (props: BoxOptions & { children?: JSX.Element }) => (
  <box {...props} />
);

const SelectContext = createContext<SelectContextValue>();

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  children?: JSX.Element;
}

export function Select(props: SelectProps): JSX.Element {
  const [internalValue, setInternalValue] = createSignal<string | undefined>(
    props.defaultValue,
  );
  const [selectedLabel, setSelectedLabel] = createSignal<string | undefined>();
  const [open, setOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [items, setItems] = createSignal<SelectItemData[]>([]);

  const value = () =>
    props.value !== undefined ? props.value : internalValue();
  const disabled = () => props.disabled ?? false;
  const placeholder = props.placeholder ?? "Select...";

  const registerItem = (item: SelectItemData) => {
    setItems((prev) => {
      if (prev.some((i) => i.value === item.value)) return prev;
      return [...prev, item];
    });
  };

  const selectValue = (val: string, label: string) => {
    if (props.value === undefined) {
      setInternalValue(val);
    }
    setSelectedLabel(label);
    props.onValueChange?.(val);
    setOpen(false);
  };

  const handleKeyPress = (key: KeyEvent) => {
    if (disabled()) return;
    if (!open()) {
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
      setActiveIndex((prev) => Math.min(items().length - 1, prev + 1));
      return;
    }

    if (key.name === "return" || key.name === "enter" || key.name === "space") {
      const active = items()[activeIndex()];
      if (active) {
        selectValue(active.value, active.label);
      }
    }
  };

  useKeyboard(handleKeyPress);

  const contextValue: SelectContextValue = {
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
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <box flexDirection="column">{props.children}</box>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends BoxOptions {
  children?: JSX.Element;
}

export function SelectTrigger(props: SelectTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(SelectContext);
  const tokens = useTheme();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      paddingX={1}
      height={3}
      onMouseDown={() => {
        if (!context?.disabled()) {
          context?.setOpen(!context.open());
        }
      }}
      {...rest}
    >
      {local.children ?? <SelectValue />}
      <text
        content={context?.open() ? "▲" : "▼"}
        fg={tokens().colors.mutedForeground}
      />
    </Box>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue(props: SelectValueProps): JSX.Element {
  const context = useContext(SelectContext);
  const tokens = useTheme();

  const label = () => {
    const custom = context?.displayLabel();
    if (custom) return custom;
    const v = context?.value();
    if (v) {
      const found = context?.items().find((i) => i.value === v);
      if (found) return found.label;
      return v;
    }
    return props.placeholder ?? context?.placeholder ?? "Select...";
  };

  const isPlaceholder = () => !context?.value() && !context?.displayLabel();

  return (
    <text
      content={label()}
      fg={
        isPlaceholder()
          ? tokens().colors.mutedForeground
          : tokens().colors.foreground
      }
    />
  );
}

export interface SelectContentProps extends BoxOptions {
  children?: JSX.Element;
}

export function SelectContent(props: SelectContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  const context = useContext(SelectContext);
  const tokens = useTheme();

  return (
    <box
      flexDirection="column"
      border
      borderStyle="single"
      borderColor={tokens().colors.border}
      backgroundColor={tokens().colors.surface}
      visible={context?.open() ?? false}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export interface SelectItemProps extends BoxOptions {
  value: string;
  children: string;
}

export function SelectItem(props: SelectItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["value", "children"]);
  const context = useContext(SelectContext);
  const tokens = useTheme();

  context?.registerItem({ value: local.value, label: local.children });

  const isSelected = () => context?.value() === local.value;
  const itemIndex = () =>
    context?.items().findIndex((i) => i.value === local.value) ?? -1;
  const isHighlighted = () => context?.activeIndex() === itemIndex();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      height={1}
      backgroundColor={
        isHighlighted() ? tokens().colors.primary : "transparent"
      }
      onMouseDown={() => context?.selectValue(local.value, local.children)}
      {...rest}
    >
      <text
        content={`${isSelected() ? "✓ " : "  "}${local.children}`}
        fg={
          isHighlighted()
            ? tokens().colors.primaryForeground
            : tokens().colors.foreground
        }
      />
    </Box>
  );
}

export interface SelectGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export function SelectGroup(props: SelectGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" {...rest}>
      {local.children}
    </box>
  );
}

export interface SelectLabelProps {
  children: string;
}

export function SelectLabel(props: SelectLabelProps): JSX.Element {
  const tokens = useTheme();
  return (
    <box paddingX={1} height={1}>
      <text content={props.children} fg={tokens().colors.mutedForeground} />
    </box>
  );
}

export interface SelectSeparatorProps extends BoxOptions {}

export function SelectSeparator(props: SelectSeparatorProps): JSX.Element {
  const tokens = useTheme();
  return (
    <box height={1} {...props}>
      <text content="─" fg={tokens().colors.border} />
    </box>
  );
}
