/** @jsxImportSource @opentui/solid */

import {
  type BoxOptions,
  TextAttributes,
  type TextOptions,
} from "@opentui/core";
import type { JSX } from "@opentui/solid";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Card Root container. */
export interface CardProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Card Header. */
export interface CardHeaderProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Card Title. */
export interface CardTitleProps extends TextOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Card Description. */
export interface CardDescriptionProps extends TextOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Card Content. */
export interface CardContentProps extends BoxOptions {
  children?: JSX.Element;
}

/** Props for the consumer-owned Solid Card Footer. */
export interface CardFooterProps extends BoxOptions {
  children?: JSX.Element;
}

/** Consumer-owned Solid Card Root container. */
export function Card(props: CardProps) {
  const [local, root] = splitProps(props, [
    "backgroundColor",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
    "padding",
  ]);
  const tokens = useTheme();

  return (
    <box
      backgroundColor={local.backgroundColor ?? tokens().colors.surface}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      flexDirection={local.flexDirection ?? "column"}
      padding={local.padding ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Card Header layout. */
export function CardHeader(props: CardHeaderProps) {
  const [local, root] = splitProps(props, ["children", "flexDirection", "gap"]);
  return (
    <box
      flexDirection={local.flexDirection ?? "column"}
      gap={local.gap ?? 0}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Card Title presentation. */
export function CardTitle(props: CardTitleProps) {
  const [local, root] = splitProps(props, [
    "attributes",
    "children",
    "content",
    "fg",
  ]);
  const tokens = useTheme();

  return (
    <text
      attributes={local.attributes ?? TextAttributes.BOLD}
      content={local.content}
      fg={local.fg ?? tokens().colors.foreground}
      {...root}
    >
      {local.children}
    </text>
  );
}

/** Consumer-owned Solid Card Description presentation. */
export function CardDescription(props: CardDescriptionProps) {
  const [local, root] = splitProps(props, [
    "attributes",
    "children",
    "content",
    "fg",
  ]);
  const tokens = useTheme();

  return (
    <text
      attributes={local.attributes ?? TextAttributes.DIM}
      content={local.content}
      fg={local.fg ?? tokens().colors.mutedForeground}
      {...root}
    >
      {local.children}
    </text>
  );
}

/** Consumer-owned Solid Card Content container. */
export function CardContent(props: CardContentProps) {
  const [local, root] = splitProps(props, [
    "children",
    "flexDirection",
    "flexGrow",
  ]);
  return (
    <box
      flexDirection={local.flexDirection ?? "column"}
      flexGrow={local.flexGrow ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Card Footer layout. */
export function CardFooter(props: CardFooterProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "gap",
    "justifyContent",
  ]);
  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      gap={local.gap ?? 1}
      justifyContent={local.justifyContent ?? "flex-end"}
      {...root}
    >
      {local.children}
    </box>
  );
}
