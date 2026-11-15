/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface BreadcrumbProps extends BoxOptions {
  children?: JSX.Element;
}

export interface BreadcrumbListProps extends BoxOptions {
  children?: JSX.Element;
}

export interface BreadcrumbItemProps extends BoxOptions {
  children?: JSX.Element;
}

export interface BreadcrumbLinkProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbPageProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbSeparatorProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbEllipsisProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

/** Consumer-owned Solid Breadcrumb container. */
export function Breadcrumb(props: BreadcrumbProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
  ]);

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

/** Consumer-owned Solid Breadcrumb List layout. */
export function BreadcrumbList(props: BreadcrumbListProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "gap",
  ]);

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      gap={local.gap ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Breadcrumb Item container. */
export function BreadcrumbItem(props: BreadcrumbItemProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "flexDirection",
    "gap",
  ]);

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      gap={local.gap ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Breadcrumb Link item. */
export function BreadcrumbLink(props: BreadcrumbLinkProps) {
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
        content={local.content ?? ""}
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}

/** Consumer-owned Solid Breadcrumb Page active item. */
export function BreadcrumbPage(props: BreadcrumbPageProps) {
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

/** Consumer-owned Solid Breadcrumb Separator glyph. */
export function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
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
        content={local.content ?? "›"}
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}

/** Consumer-owned Solid Breadcrumb Ellipsis indicator. */
export function BreadcrumbEllipsis(props: BreadcrumbEllipsisProps) {
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
        content={local.content ?? "…"}
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}
