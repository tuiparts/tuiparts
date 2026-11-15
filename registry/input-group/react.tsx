/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import type { PropsWithChildren } from "react";
import { useTheme } from "./use-theme";

export interface InputGroupProps extends PropsWithChildren<BoxOptions> {}

export interface InputGroupAddonProps extends PropsWithChildren<BoxOptions> {}

export interface InputGroupTextProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

/** Consumer-owned React InputGroup container. */
export function InputGroup({
  alignItems = "center",
  border = true,
  borderColor,
  borderStyle,
  children,
  flexDirection = "row",
  ...props
}: InputGroupProps) {
  const tokens = useTheme();

  return (
    <box
      alignItems={alignItems}
      border={border}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      flexDirection={flexDirection}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React InputGroup Addon container. */
export function InputGroupAddon({
  alignItems = "center",
  backgroundColor,
  children,
  flexDirection = "row",
  paddingX = 1,
  ...props
}: InputGroupAddonProps) {
  const tokens = useTheme();

  return (
    <box
      alignItems={alignItems}
      backgroundColor={backgroundColor ?? tokens.colors.surface}
      flexDirection={flexDirection}
      paddingX={paddingX}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React InputGroup Text presentation. */
export function InputGroupText({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  paddingX = 1,
  textOptions,
  ...props
}: InputGroupTextProps) {
  const tokens = useTheme();

  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      paddingX={paddingX}
      {...props}
    >
      {children ?? (
        <text
          content={content ?? ""}
          fg={textOptions?.fg ?? tokens.colors.mutedForeground}
          {...textOptions}
        />
      )}
    </box>
  );
}
