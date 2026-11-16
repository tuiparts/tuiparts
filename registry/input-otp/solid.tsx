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

export interface InputOTPContextValue {
  value: Accessor<string>;
  maxLength: number;
  focusedIndex: Accessor<number>;
  isFocused: Accessor<boolean>;
  disabled: Accessor<boolean>;
}

const InputOTPContext = createContext<InputOTPContextValue>();

export interface InputOTPProps extends BoxOptions {
  maxLength: number;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  children?: JSX.Element;
}

export function InputOTP(props: InputOTPProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "maxLength",
    "value",
    "defaultValue",
    "disabled",
    "onChange",
    "onComplete",
    "children",
  ]);

  const [internalValue, setInternalValue] = createSignal(
    local.defaultValue ?? "",
  );
  const [focusedIndex, setFocusedIndex] = createSignal(0);

  const value = () =>
    local.value !== undefined ? local.value : internalValue();
  const disabled = () => local.disabled ?? false;

  const handleKeyPress = (key: KeyEvent) => {
    if (disabled()) return;
    const current = value();
    if (key.name === "backspace") {
      if (current.length > 0) {
        const next = current.slice(0, -1);
        if (local.value === undefined) setInternalValue(next);
        setFocusedIndex(Math.max(0, next.length));
        local.onChange?.(next);
      }
      return;
    }
    if (key.name === "left") {
      setFocusedIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.name === "right") {
      setFocusedIndex((prev) =>
        Math.min(Math.min(current.length, local.maxLength - 1), prev + 1),
      );
      return;
    }
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      if (current.length < local.maxLength) {
        const next = current + key.sequence;
        if (local.value === undefined) setInternalValue(next);
        setFocusedIndex(Math.min(next.length, local.maxLength - 1));
        local.onChange?.(next);
        if (next.length === local.maxLength) {
          local.onComplete?.(next);
        }
      }
    }
  };

  useKeyboard(handleKeyPress);

  const contextValue: InputOTPContextValue = {
    value,
    maxLength: local.maxLength,
    focusedIndex,
    isFocused: () => !disabled(),
    disabled,
  };

  return (
    <InputOTPContext.Provider value={contextValue}>
      <box flexDirection="row" alignItems="center" gap={1} {...rest}>
        {local.children}
      </box>
    </InputOTPContext.Provider>
  );
}

export interface InputOTPGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export function InputOTPGroup(props: InputOTPGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="row" alignItems="center" {...rest}>
      {local.children}
    </box>
  );
}

export interface InputOTPSlotProps extends BoxOptions {
  index: number;
  mask?: string | boolean;
}

export function InputOTPSlot(props: InputOTPSlotProps): JSX.Element {
  const [local, rest] = splitProps(props, ["index", "mask"]);
  const context = useContext(InputOTPContext);
  const tokens = useTheme();

  const char = () => context?.value()[local.index];
  const isActive = () =>
    (context?.isFocused() ?? false) && context?.focusedIndex() === local.index;
  const displayChar = () => {
    const c = char();
    if (c !== undefined) {
      if (local.mask) {
        return typeof local.mask === "string" ? local.mask : "•";
      }
      return c;
    }
    if (isActive()) return "█";
    return " ";
  };

  return (
    <box
      width={3}
      height={3}
      border
      borderStyle="single"
      borderColor={
        isActive() ? tokens().colors.primary : tokens().colors.border
      }
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      <text
        content={displayChar()}
        fg={isActive() ? tokens().colors.primary : tokens().colors.foreground}
      />
    </box>
  );
}

export interface InputOTPSeparatorProps extends BoxOptions {}

export function InputOTPSeparator(props: InputOTPSeparatorProps): JSX.Element {
  const tokens = useTheme();
  return (
    <box paddingX={1} alignItems="center" justifyContent="center" {...props}>
      <text content="-" fg={tokens().colors.mutedForeground} />
    </box>
  );
}
