/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface EmptyProps extends BoxOptions {
  children?: JSX.Element;
}

export interface EmptyHeaderProps extends BoxOptions {
  children?: JSX.Element;
}

export interface EmptyMediaProps extends BoxOptions {
  children?: JSX.Element;
}

export interface EmptyTitleProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface EmptyDescriptionProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface EmptyContentProps extends BoxOptions {
  children?: JSX.Element;
}

/** Consumer-owned Solid Empty container. */
export function Empty(props: EmptyProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
    "gap",
    "justifyContent",
    "padding",
  ]);
  const tokens = useTheme();

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      border={local.border ?? true}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      flexDirection={local.flexDirection ?? "column"}
      gap={local.gap ?? 1}
      justifyContent={local.justifyContent ?? "center"}
      padding={local.padding ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Empty Header layout. */
export function EmptyHeader(props: EmptyHeaderProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "gap",
  ]);

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "column"}
      gap={local.gap ?? 0}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Empty Media / icon layout. */
export function EmptyMedia(props: EmptyMediaProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "justifyContent",
  ]);

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      justifyContent={local.justifyContent ?? "center"}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Empty Title heading. */
export function EmptyTitle(props: EmptyTitleProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "content",
    "flexDirection",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
    return (
      <box
        alignItems={local.alignItems ?? "center"}
        flexDirection={local.flexDirection ?? "row"}
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
      {...root}
    >
      <text
        attributes={local.textOptions?.attributes ?? TextAttributes.BOLD}
        content={local.content ?? ""}
        fg={local.textOptions?.fg ?? tokens().colors.foreground}
        {...local.textOptions}
      />
    </box>
  );
}

/** Consumer-owned Solid Empty Description text. */
export function EmptyDescription(props: EmptyDescriptionProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "content",
    "flexDirection",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
    return (
      <box
        alignItems={local.alignItems ?? "center"}
        flexDirection={local.flexDirection ?? "row"}
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

/** Consumer-owned Solid Empty Content layout. */
export function EmptyContent(props: EmptyContentProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "gap",
  ]);

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "column"}
      gap={local.gap ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}
