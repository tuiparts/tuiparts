/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

export type FieldOrientation = "horizontal" | "vertical";

export interface FieldSetProps extends BoxOptions {
  children?: ReactNode;
}

export interface FieldGroupProps extends BoxOptions {
  children?: ReactNode;
}

export interface FieldProps extends BoxOptions {
  orientation?: FieldOrientation;
  children?: ReactNode;
}

export interface FieldContentProps extends BoxOptions {
  children?: ReactNode;
}

export interface FieldLabelProps extends Omit<TextOptions, "content"> {
  content?: string;
  required?: boolean;
  children?: ReactNode;
}

export interface FieldDescriptionProps extends Omit<TextOptions, "content"> {
  content?: string;
  children?: ReactNode;
}

export interface FieldErrorProps extends Omit<TextOptions, "content"> {
  content?: string;
  errors?: Array<{ message?: string } | string | undefined>;
  children?: ReactNode;
}

export interface FieldLegendProps extends Omit<TextOptions, "content"> {
  content?: string;
  children?: ReactNode;
}

export interface FieldSeparatorProps extends BoxOptions {
  label?: string;
}

export function FieldSet({ children, ...props }: FieldSetProps) {
  return (
    <box flexDirection="column" gap={1} {...props}>
      {children}
    </box>
  );
}

export function FieldGroup({ children, ...props }: FieldGroupProps) {
  return (
    <box flexDirection="column" gap={1} {...props}>
      {children}
    </box>
  );
}

export function Field({
  orientation = "vertical",
  children,
  ...props
}: FieldProps) {
  return (
    <box
      flexDirection={orientation === "horizontal" ? "row" : "column"}
      gap={orientation === "horizontal" ? 1 : 0}
      {...props}
    >
      {children}
    </box>
  );
}

export function FieldContent({ children, ...props }: FieldContentProps) {
  return (
    <box flexDirection="column" flexGrow={1} {...props}>
      {children}
    </box>
  );
}

export function FieldLabel({
  content,
  required = false,
  children,
  ...props
}: FieldLabelProps) {
  const tokens = useTheme();
  const textContent =
    content !== undefined
      ? required
        ? `${content} *`
        : content
      : typeof children === "string"
        ? required
          ? `${children} *`
          : children
        : undefined;

  return (
    <text
      content={textContent ?? ""}
      fg={props.fg ?? tokens.colors.foreground}
      {...props}
    />
  );
}

export function FieldDescription({
  content,
  children,
  ...props
}: FieldDescriptionProps) {
  const tokens = useTheme();
  const textContent = content ?? (typeof children === "string" ? children : "");

  return (
    <text
      content={textContent}
      fg={props.fg ?? tokens.colors.mutedForeground}
      {...props}
    />
  );
}

export function FieldError({
  content,
  errors,
  children,
  ...props
}: FieldErrorProps) {
  const tokens = useTheme();

  let textContent = content ?? (typeof children === "string" ? children : "");
  if (!textContent && errors && errors.length > 0) {
    const messages = errors
      .map((e) => (typeof e === "string" ? e : e?.message))
      .filter((msg): msg is string => Boolean(msg));
    textContent = messages.join("; ");
  }

  if (!textContent) return null;

  return (
    <text
      content={textContent}
      fg={props.fg ?? tokens.colors.destructive}
      {...props}
    />
  );
}

export function FieldLegend({ content, children, ...props }: FieldLegendProps) {
  const tokens = useTheme();
  const textContent = content ?? (typeof children === "string" ? children : "");

  return (
    <text
      content={textContent}
      fg={props.fg ?? tokens.colors.foreground}
      {...props}
    />
  );
}

export function FieldSeparator({ label, ...props }: FieldSeparatorProps) {
  const tokens = useTheme();

  return (
    <box height={1} flexDirection="row" alignItems="center" {...props}>
      <text
        content={label ? `── ${label} ──` : "──────"}
        fg={tokens.colors.border}
      />
    </box>
  );
}
