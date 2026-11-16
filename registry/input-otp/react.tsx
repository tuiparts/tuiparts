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

export interface InputOTPContextValue {
  value: string;
  maxLength: number;
  focusedIndex: number;
  isFocused: boolean;
  disabled?: boolean;
}

const InputOTPContext = createContext<InputOTPContextValue | null>(null);

export interface InputOTPProps extends BoxOptions {
  maxLength: number;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  children: ReactNode;
}

export function InputOTP({
  maxLength,
  value: controlledValue,
  defaultValue = "",
  disabled = false,
  onChange,
  onComplete,
  children,
  ...rest
}: InputOTPProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleKeyPress = useCallback(
    (key: KeyEvent) => {
      if (disabled) return;
      if (key.name === "backspace") {
        if (value.length > 0) {
          const next = value.slice(0, -1);
          if (!isControlled) setInternalValue(next);
          setFocusedIndex(Math.max(0, next.length));
          onChange?.(next);
        }
        return;
      }
      if (key.name === "left") {
        setFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.name === "right") {
        setFocusedIndex((prev) =>
          Math.min(Math.min(value.length, maxLength - 1), prev + 1),
        );
        return;
      }
      if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
        if (value.length < maxLength) {
          const next = value + key.sequence;
          if (!isControlled) setInternalValue(next);
          setFocusedIndex(Math.min(next.length, maxLength - 1));
          onChange?.(next);
          if (next.length === maxLength) {
            onComplete?.(next);
          }
        }
      }
    },
    [disabled, value, maxLength, isControlled, onChange, onComplete],
  );

  useKeyboard(handleKeyPress);

  const contextValue = useMemo<InputOTPContextValue>(
    () => ({
      value,
      maxLength,
      focusedIndex,
      isFocused: !disabled,
      disabled,
    }),
    [value, maxLength, focusedIndex, disabled],
  );

  return (
    <InputOTPContext.Provider value={contextValue}>
      <box flexDirection="row" alignItems="center" gap={1} {...rest}>
        {children}
      </box>
    </InputOTPContext.Provider>
  );
}

export interface InputOTPGroupProps extends BoxOptions {
  children: ReactNode;
}

export function InputOTPGroup({ children, ...rest }: InputOTPGroupProps) {
  return (
    <box flexDirection="row" alignItems="center" {...rest}>
      {children}
    </box>
  );
}

export interface InputOTPSlotProps extends BoxOptions {
  index: number;
  mask?: string | boolean;
}

export function InputOTPSlot({ index, mask, ...rest }: InputOTPSlotProps) {
  const context = useContext(InputOTPContext);
  const tokens = useTheme();

  const char = context?.value[index];
  const isActive = context?.isFocused && context.focusedIndex === index;
  let displayChar = " ";
  if (char !== undefined) {
    displayChar = mask ? (typeof mask === "string" ? mask : "•") : char;
  } else if (isActive) {
    displayChar = "█";
  }

  return (
    <box
      width={3}
      height={3}
      border
      borderStyle="single"
      borderColor={isActive ? tokens.colors.primary : tokens.colors.border}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      <text
        content={displayChar}
        fg={isActive ? tokens.colors.primary : tokens.colors.foreground}
      />
    </box>
  );
}

export interface InputOTPSeparatorProps extends BoxOptions {}

export function InputOTPSeparator(props: InputOTPSeparatorProps) {
  const tokens = useTheme();
  return (
    <box paddingX={1} alignItems="center" justifyContent="center" {...props}>
      <text content="-" fg={tokens.colors.mutedForeground} />
    </box>
  );
}
