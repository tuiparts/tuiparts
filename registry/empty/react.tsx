/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import type { PropsWithChildren } from "react";
import { useTheme } from "./use-theme";

export interface EmptyProps extends PropsWithChildren<BoxOptions> {}

export interface EmptyHeaderProps extends PropsWithChildren<BoxOptions> {}

export interface EmptyMediaProps extends PropsWithChildren<BoxOptions> {}

export interface EmptyTitleProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface EmptyDescriptionProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface EmptyContentProps extends PropsWithChildren<BoxOptions> {}

/** Consumer-owned React Empty container. */
export function Empty({
  alignItems = "center",
  border = true,
  borderColor,
  borderStyle,
  children,
  flexDirection = "column",
  gap = 1,
  justifyContent = "center",
  padding = 1,
  ...props
}: EmptyProps) {
  const tokens = useTheme();

  return (
    <box
      alignItems={alignItems}
      border={border}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      flexDirection={flexDirection}
      gap={gap}
      justifyContent={justifyContent}
      padding={padding}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Empty Header layout. */
export function EmptyHeader({
  alignItems = "center",
  children,
  flexDirection = "column",
  gap = 0,
  ...props
}: EmptyHeaderProps) {
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      gap={gap}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Empty Media / icon layout. */
export function EmptyMedia({
  alignItems = "center",
  children,
  flexDirection = "row",
  justifyContent = "center",
  ...props
}: EmptyMediaProps) {
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Empty Title heading. */
export function EmptyTitle({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  textOptions,
  ...props
}: EmptyTitleProps) {
  const tokens = useTheme();

  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
      {children ?? (
        <text
          attributes={textOptions?.attributes ?? TextAttributes.BOLD}
          content={content ?? ""}
          fg={textOptions?.fg ?? tokens.colors.foreground}
          {...textOptions}
        />
      )}
    </box>
  );
}

/** Consumer-owned React Empty Description text. */
export function EmptyDescription({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  textOptions,
  ...props
}: EmptyDescriptionProps) {
  const tokens = useTheme();

  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
      {children ?? (
        <text
          attributes={textOptions?.attributes ?? TextAttributes.DIM}
          content={content ?? ""}
          fg={textOptions?.fg ?? tokens.colors.mutedForeground}
          {...textOptions}
        />
      )}
    </box>
  );
}

/** Consumer-owned React Empty Content layout. */
export function EmptyContent({
  alignItems = "center",
  children,
  flexDirection = "column",
  gap = 1,
  ...props
}: EmptyContentProps) {
  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      gap={gap}
      {...props}
    >
      {children}
    </box>
  );
}
