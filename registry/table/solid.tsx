/** @jsxImportSource @opentui/solid */

import {
  type BoxOptions,
  TextAttributes,
  type TextOptions,
} from "@opentui/core";
import type { JSX } from "@opentui/solid";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Table container. */
export interface TableProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Table Header section. */
export interface TableHeaderProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Table Body section. */
export interface TableBodyProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Table Footer section. */
export interface TableFooterProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Table Row layout. */
export interface TableRowProps extends BoxOptions {
  children?: JSX.Element;
  /** Whether to draw a bottom border dividing this row. Defaults to true. */
  borderBottom?: boolean;
}

/** Props for the consumer-owned Solid Table Head column header. */
export interface TableHeadProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Props for the consumer-owned Solid Table Cell data container. */
export interface TableCellProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Props for the consumer-owned Solid Table Caption. */
export interface TableCaptionProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Consumer-owned Solid Table container. */
export function Table(props: TableProps) {
  const [local, root] = splitProps(props, [
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
  ]);
  const tokens = useTheme();

  return (
    <box
      border={local.border ?? true}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      flexDirection={local.flexDirection ?? "column"}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Table Header layout. */
export function TableHeader(props: TableHeaderProps) {
  const [local, root] = splitProps(props, ["children", "flexDirection"]);
  return (
    <box flexDirection={local.flexDirection ?? "column"} {...root}>
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Table Body container. */
export function TableBody(props: TableBodyProps) {
  const [local, root] = splitProps(props, ["children", "flexDirection"]);
  return (
    <box flexDirection={local.flexDirection ?? "column"} {...root}>
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Table Footer layout. */
export function TableFooter(props: TableFooterProps) {
  const [local, root] = splitProps(props, [
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
  ]);
  const tokens = useTheme();

  return (
    <box
      border={local.border ?? ["top"]}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? "single"}
      flexDirection={local.flexDirection ?? "column"}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Table Row layout. */
export function TableRow(props: TableRowProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "border",
    "borderBottom",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
  ]);
  const tokens = useTheme();

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      border={
        local.border ?? (local.borderBottom !== false ? ["bottom"] : false)
      }
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? "single"}
      flexDirection={local.flexDirection ?? "row"}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Table Head column header. */
export function TableHead(props: TableHeadProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "content",
    "flexDirection",
    "paddingX",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
    return (
      <box
        alignItems={local.alignItems ?? "center"}
        flexDirection={local.flexDirection ?? "row"}
        paddingX={local.paddingX ?? 1}
        {...root}
      >
        {local.children}
      </box>
    );
  }

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      paddingX={local.paddingX ?? 1}
      {...root}
    >
      <text
        attributes={local.textOptions?.attributes ?? TextAttributes.BOLD}
        content={local.content ?? ""}
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}

/** Consumer-owned Solid Table Cell data container. */
export function TableCell(props: TableCellProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "content",
    "flexDirection",
    "paddingX",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
    return (
      <box
        alignItems={local.alignItems ?? "center"}
        flexDirection={local.flexDirection ?? "row"}
        paddingX={local.paddingX ?? 1}
        {...root}
      >
        {local.children}
      </box>
    );
  }

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      paddingX={local.paddingX ?? 1}
      {...root}
    >
      <text
        content={local.content ?? ""}
        fg={local.textOptions?.fg ?? tokens().colors.foreground}
        {...local.textOptions}
      />
    </box>
  );
}

/** Consumer-owned Solid Table Caption presentation. */
export function TableCaption(props: TableCaptionProps) {
  const [local, root] = splitProps(props, [
    "children",
    "content",
    "paddingTop",
    "paddingX",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
    return (
      <box
        paddingTop={local.paddingTop ?? 1}
        paddingX={local.paddingX ?? 1}
        {...root}
      >
        {local.children}
      </box>
    );
  }

  return (
    <box
      paddingTop={local.paddingTop ?? 1}
      paddingX={local.paddingX ?? 1}
      {...root}
    >
      <text
        attributes={local.textOptions?.attributes ?? TextAttributes.DIM}
        content={local.content ?? ""}
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}
