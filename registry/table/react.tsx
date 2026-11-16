/** @jsxImportSource @opentui/react */

import {
  type BoxOptions,
  TextAttributes,
  type TextOptions,
} from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Table container. */
export interface TableProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Table Header section. */
export interface TableHeaderProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Table Body section. */
export interface TableBodyProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Table Footer section. */
export interface TableFooterProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Table Row layout. */
export interface TableRowProps extends BoxOptions {
  children?: ReactNode;
  /** Whether to draw a bottom border dividing this row. Defaults to true. */
  borderBottom?: boolean;
}

/** Props for the consumer-owned React Table Head column header. */
export interface TableHeadProps extends BoxOptions {
  children?: ReactNode;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Props for the consumer-owned React Table Cell data container. */
export interface TableCellProps extends BoxOptions {
  children?: ReactNode;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Props for the consumer-owned React Table Caption. */
export interface TableCaptionProps extends BoxOptions {
  children?: ReactNode;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Consumer-owned React Table container. */
export function Table({
  border,
  borderColor,
  borderStyle,
  children,
  flexDirection = "column",
  ...props
}: TableProps) {
  const tokens = useTheme();
  return (
    <box
      border={border ?? true}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      flexDirection={flexDirection}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Table Header layout. */
export function TableHeader({
  children,
  flexDirection = "column",
  ...props
}: TableHeaderProps) {
  return (
    <box flexDirection={flexDirection} {...props}>
      {children}
    </box>
  );
}

/** Consumer-owned React Table Body container. */
export function TableBody({
  children,
  flexDirection = "column",
  ...props
}: TableBodyProps) {
  return (
    <box flexDirection={flexDirection} {...props}>
      {children}
    </box>
  );
}

/** Consumer-owned React Table Footer layout. */
export function TableFooter({
  border,
  borderColor,
  borderStyle = "single",
  children,
  flexDirection = "column",
  ...props
}: TableFooterProps) {
  const tokens = useTheme();
  return (
    <box
      border={border ?? ["top"]}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle}
      flexDirection={flexDirection}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Table Row layout. */
export function TableRow({
  alignItems = "center",
  border,
  borderBottom = true,
  borderColor,
  borderStyle = "single",
  children,
  flexDirection = "row",
  ...props
}: TableRowProps) {
  const tokens = useTheme();
  return (
    <box
      alignItems={alignItems}
      border={border ?? (borderBottom ? ["bottom"] : false)}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle}
      flexDirection={flexDirection}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Table Head column header. */
export function TableHead({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  paddingX = 1,
  textOptions,
  ...props
}: TableHeadProps) {
  const tokens = useTheme();
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      paddingX={paddingX}
      {...props}
    >
      {children ??
        (content !== undefined ? (
          <text
            attributes={textOptions?.attributes ?? TextAttributes.BOLD}
            content={content}
            fg={textOptions?.fg ?? tokens.colors.mutedForeground}
            {...textOptions}
          />
        ) : null)}
    </box>
  );
}

/** Consumer-owned React Table Cell data container. */
export function TableCell({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  paddingX = 1,
  textOptions,
  ...props
}: TableCellProps) {
  const tokens = useTheme();
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      paddingX={paddingX}
      {...props}
    >
      {children ??
        (content !== undefined ? (
          <text
            content={content}
            fg={textOptions?.fg ?? tokens.colors.foreground}
            {...textOptions}
          />
        ) : null)}
    </box>
  );
}

/** Consumer-owned React Table Caption presentation. */
export function TableCaption({
  children,
  content,
  paddingTop = 1,
  paddingX = 1,
  textOptions,
  ...props
}: TableCaptionProps) {
  const tokens = useTheme();
  return (
    <box paddingTop={paddingTop} paddingX={paddingX} {...props}>
      {children ??
        (content !== undefined ? (
          <text
            attributes={textOptions?.attributes ?? TextAttributes.DIM}
            content={content}
            fg={textOptions?.fg ?? tokens.colors.mutedForeground}
            {...textOptions}
          />
        ) : null)}
    </box>
  );
}
