/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import type { PropsWithChildren } from "react";
import { useTheme } from "./use-theme";

export interface BreadcrumbProps extends PropsWithChildren<BoxOptions> {}

export interface BreadcrumbListProps extends PropsWithChildren<BoxOptions> {}

export interface BreadcrumbItemProps extends PropsWithChildren<BoxOptions> {}

export interface BreadcrumbLinkProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbPageProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbSeparatorProps
  extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbEllipsisProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

/** Consumer-owned React Breadcrumb container. */
export function Breadcrumb({
  alignItems = "center",
  children,
  flexDirection = "row",
  ...props
}: BreadcrumbProps) {
  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
      {children}
    </box>
  );
}

/** Consumer-owned React Breadcrumb List layout. */
export function BreadcrumbList({
  alignItems = "center",
  children,
  flexDirection = "row",
  gap = 1,
  ...props
}: BreadcrumbListProps) {
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

/** Consumer-owned React Breadcrumb Item container. */
export function BreadcrumbItem({
  alignItems = "center",
  children,
  flexDirection = "row",
  gap = 1,
  ...props
}: BreadcrumbItemProps) {
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

/** Consumer-owned React Breadcrumb Link item. */
export function BreadcrumbLink({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  textOptions,
  ...props
}: BreadcrumbLinkProps) {
  const tokens = useTheme();

  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
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

/** Consumer-owned React Breadcrumb Page active item. */
export function BreadcrumbPage({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  textOptions,
  ...props
}: BreadcrumbPageProps) {
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

/** Consumer-owned React Breadcrumb Separator glyph. */
export function BreadcrumbSeparator({
  alignItems = "center",
  children,
  content = "›",
  flexDirection = "row",
  textOptions,
  ...props
}: BreadcrumbSeparatorProps) {
  const tokens = useTheme();

  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
      {children ?? (
        <text
          content={content}
          fg={textOptions?.fg ?? tokens.colors.mutedForeground}
          {...textOptions}
        />
      )}
    </box>
  );
}

/** Consumer-owned React Breadcrumb Ellipsis indicator. */
export function BreadcrumbEllipsis({
  alignItems = "center",
  children,
  content = "…",
  flexDirection = "row",
  textOptions,
  ...props
}: BreadcrumbEllipsisProps) {
  const tokens = useTheme();

  return (
    <box alignItems={alignItems} flexDirection={flexDirection} {...props}>
      {children ?? (
        <text
          content={content}
          fg={textOptions?.fg ?? tokens.colors.mutedForeground}
          {...textOptions}
        />
      )}
    </box>
  );
}
