/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export type FieldOrientation = "horizontal" | "vertical";

export interface FieldSetProps extends BoxOptions {
  children?: JSX.Element;
}

export interface FieldGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export interface FieldProps extends BoxOptions {
  orientation?: FieldOrientation;
  children?: JSX.Element;
}

export interface FieldContentProps extends BoxOptions {
  children?: JSX.Element;
}

export interface FieldLabelProps extends Omit<TextOptions, "content"> {
  content?: string;
  required?: boolean;
  children?: JSX.Element;
}

export interface FieldDescriptionProps extends Omit<TextOptions, "content"> {
  content?: string;
  children?: JSX.Element;
}

export interface FieldErrorProps extends Omit<TextOptions, "content"> {
  content?: string;
  errors?: Array<{ message?: string } | string | undefined>;
  children?: JSX.Element;
}

export interface FieldLegendProps extends Omit<TextOptions, "content"> {
  content?: string;
  children?: JSX.Element;
}

export interface FieldSeparatorProps extends BoxOptions {
  label?: string;
}

export function FieldSet(props: FieldSetProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" gap={1} {...rest}>
      {local.children}
    </box>
  );
}

export function FieldGroup(props: FieldGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" gap={1} {...rest}>
      {local.children}
    </box>
  );
}

export function Field(props: FieldProps): JSX.Element {
  const [local, rest] = splitProps(props, ["orientation", "children"]);
  return (
    <box
      flexDirection={local.orientation === "horizontal" ? "row" : "column"}
      gap={local.orientation === "horizontal" ? 1 : 0}
      {...rest}
    >
      {local.children}
    </box>
  );
}

export function FieldContent(props: FieldContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="column" flexGrow={1} {...rest}>
      {local.children}
    </box>
  );
}

export function FieldLabel(props: FieldLabelProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "content",
    "required",
    "children",
    "fg",
  ]);
  const tokens = useTheme();

  const textContent = () => {
    if (local.content !== undefined) {
      return local.required ? `${local.content} *` : local.content;
    }
    if (typeof local.children === "string") {
      return local.required ? `${local.children} *` : local.children;
    }
    return "";
  };

  return (
    <text
      content={textContent()}
      fg={local.fg ?? tokens().colors.foreground}
      {...rest}
    />
  );
}

export function FieldDescription(props: FieldDescriptionProps): JSX.Element {
  const [local, rest] = splitProps(props, ["content", "children", "fg"]);
  const tokens = useTheme();

  const textContent = () =>
    local.content ?? (typeof local.children === "string" ? local.children : "");

  return (
    <text
      content={textContent()}
      fg={local.fg ?? tokens().colors.mutedForeground}
      {...rest}
    />
  );
}

export function FieldError(props: FieldErrorProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "content",
    "errors",
    "children",
    "fg",
  ]);
  const tokens = useTheme();

  const textContent = () => {
    let resolved =
      local.content ??
      (typeof local.children === "string" ? local.children : "");
    if (!resolved && local.errors && local.errors.length > 0) {
      const messages = local.errors
        .map((e) => (typeof e === "string" ? e : e?.message))
        .filter((msg): msg is string => Boolean(msg));
      resolved = messages.join("; ");
    }
    return resolved;
  };

  return (
    <text
      content={textContent()}
      fg={local.fg ?? tokens().colors.destructive}
      {...rest}
    />
  );
}

export function FieldLegend(props: FieldLegendProps): JSX.Element {
  const [local, rest] = splitProps(props, ["content", "children", "fg"]);
  const tokens = useTheme();

  const textContent = () =>
    local.content ?? (typeof local.children === "string" ? local.children : "");

  return (
    <text
      content={textContent()}
      fg={local.fg ?? tokens().colors.foreground}
      {...rest}
    />
  );
}

export function FieldSeparator(props: FieldSeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["label"]);
  const tokens = useTheme();

  return (
    <box height={1} flexDirection="row" alignItems="center" {...rest}>
      <text
        content={local.label ? `── ${local.label} ──` : "──────"}
        fg={tokens().colors.border}
      />
    </box>
  );
}
