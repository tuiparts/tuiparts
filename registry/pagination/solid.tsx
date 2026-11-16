/** @jsxImportSource @opentui/solid */

import type { BoxOptions } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface PaginationProps extends BoxOptions {
  children?: JSX.Element;
}

export interface PaginationContentProps extends BoxOptions {
  children?: JSX.Element;
}

export interface PaginationItemProps extends BoxOptions {
  children?: JSX.Element;
}

export interface PaginationLinkProps extends BoxOptions {
  isActive?: boolean;
  label?: string;
  children?: JSX.Element;
}

export interface PaginationPreviousProps extends BoxOptions {
  label?: string;
  children?: JSX.Element;
}

export interface PaginationNextProps extends BoxOptions {
  label?: string;
  children?: JSX.Element;
}

export interface PaginationEllipsisProps extends BoxOptions {
  label?: string;
  children?: JSX.Element;
}

export function Pagination(props: PaginationProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="row" justifyContent="center" width="100%" {...rest}>
      {local.children}
    </box>
  );
}

export function PaginationContent(props: PaginationContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return (
    <box flexDirection="row" alignItems="center" gap={1} {...rest}>
      {local.children}
    </box>
  );
}

export function PaginationItem(props: PaginationItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"]);
  return <box {...rest}>{local.children}</box>;
}

export function PaginationLink(props: PaginationLinkProps): JSX.Element {
  const [local, rest] = splitProps(props, ["isActive", "label", "children"]);
  const tokens = useTheme();

  const textContent = () =>
    local.label ??
    (typeof local.children === "string" ? local.children : undefined);

  return (
    <box
      paddingX={tokens().density.paddingX}
      backgroundColor={
        local.isActive ? tokens().colors.primary : tokens().colors.surface
      }
      borderColor={local.isActive ? tokens().colors.primary : undefined}
      borderStyle={local.isActive ? tokens().borders.style : undefined}
      {...rest}
    >
      {textContent() !== undefined ? (
        <text
          content={textContent()}
          fg={
            local.isActive
              ? tokens().colors.primaryForeground
              : tokens().colors.foreground
          }
        />
      ) : (
        local.children
      )}
    </box>
  );
}

export function PaginationPrevious(
  props: PaginationPreviousProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["label", "children"]);
  return (
    <PaginationLink label={local.label ?? "‹ Previous"} {...rest}>
      {local.children}
    </PaginationLink>
  );
}

export function PaginationNext(props: PaginationNextProps): JSX.Element {
  const [local, rest] = splitProps(props, ["label", "children"]);
  return (
    <PaginationLink label={local.label ?? "Next ›"} {...rest}>
      {local.children}
    </PaginationLink>
  );
}

export function PaginationEllipsis(
  props: PaginationEllipsisProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["label", "children"]);
  const tokens = useTheme();

  const textContent = () =>
    local.label ??
    (typeof local.children === "string" ? local.children : "...");

  return (
    <box paddingX={tokens().density.paddingX} {...rest}>
      <text content={textContent()} fg={tokens().colors.mutedForeground} />
      {typeof local.children !== "string" && local.children}
    </box>
  );
}
