/** @jsxImportSource @opentui/react */

import {
  type BoxOptions,
  TextAttributes,
  type TextOptions,
} from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Card Root container. */
export interface CardProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Card Header. */
export interface CardHeaderProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Card Title. */
export interface CardTitleProps extends TextOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Card Description. */
export interface CardDescriptionProps extends TextOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Card Content. */
export interface CardContentProps extends BoxOptions {
  children?: ReactNode;
}

/** Props for the consumer-owned React Card Footer. */
export interface CardFooterProps extends BoxOptions {
  children?: ReactNode;
}

/** Consumer-owned React Card Root container. */
export function Card({
  backgroundColor,
  borderColor,
  borderStyle,
  children,
  flexDirection = "column",
  padding = 1,
  ...props
}: CardProps) {
  const tokens = useTheme();
  return (
    <box
      backgroundColor={backgroundColor ?? tokens.colors.surface}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      flexDirection={flexDirection}
      padding={padding}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Card Header layout. */
export function CardHeader({
  children,
  flexDirection = "column",
  gap = 0,
  ...props
}: CardHeaderProps) {
  return (
    <box flexDirection={flexDirection} gap={gap} {...props}>
      {children}
    </box>
  );
}

/** Consumer-owned React Card Title presentation. */
export function CardTitle({
  attributes,
  children,
  content,
  fg,
  ...props
}: CardTitleProps) {
  const tokens = useTheme();
  return (
    <text
      attributes={attributes ?? TextAttributes.BOLD}
      content={content}
      fg={fg ?? tokens.colors.foreground}
      {...props}
    >
      {children}
    </text>
  );
}

/** Consumer-owned React Card Description presentation. */
export function CardDescription({
  attributes,
  children,
  content,
  fg,
  ...props
}: CardDescriptionProps) {
  const tokens = useTheme();
  return (
    <text
      attributes={attributes ?? TextAttributes.DIM}
      content={content}
      fg={fg ?? tokens.colors.mutedForeground}
      {...props}
    >
      {children}
    </text>
  );
}

/** Consumer-owned React Card Content container. */
export function CardContent({
  children,
  flexDirection = "column",
  flexGrow = 1,
  ...props
}: CardContentProps) {
  return (
    <box flexDirection={flexDirection} flexGrow={flexGrow} {...props}>
      {children}
    </box>
  );
}

/** Consumer-owned React Card Footer layout. */
export function CardFooter({
  alignItems = "center",
  children,
  flexDirection = "row",
  gap = 1,
  justifyContent = "flex-end",
  ...props
}: CardFooterProps) {
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      gap={gap}
      justifyContent={justifyContent}
      {...props}
    >
      {children}
    </box>
  );
}
