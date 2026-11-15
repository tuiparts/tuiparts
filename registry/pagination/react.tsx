/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

export interface PaginationProps extends BoxOptions {
  children?: ReactNode;
}

export interface PaginationContentProps extends BoxOptions {
  children?: ReactNode;
}

export interface PaginationItemProps extends BoxOptions {
  children?: ReactNode;
}

export interface PaginationLinkProps extends BoxOptions {
  isActive?: boolean;
  label?: string;
  children?: ReactNode;
}

export interface PaginationPreviousProps extends BoxOptions {
  label?: string;
  children?: ReactNode;
}

export interface PaginationNextProps extends BoxOptions {
  label?: string;
  children?: ReactNode;
}

export interface PaginationEllipsisProps extends BoxOptions {
  label?: string;
  children?: ReactNode;
}

export function Pagination({ children, ...props }: PaginationProps) {
  return (
    <box flexDirection="row" justifyContent="center" width="100%" {...props}>
      {children}
    </box>
  );
}

export function PaginationContent({
  children,
  ...props
}: PaginationContentProps) {
  return (
    <box flexDirection="row" alignItems="center" gap={1} {...props}>
      {children}
    </box>
  );
}

export function PaginationItem({ children, ...props }: PaginationItemProps) {
  return <box {...props}>{children}</box>;
}

export function PaginationLink({
  isActive = false,
  label,
  children,
  ...props
}: PaginationLinkProps) {
  const tokens = useTheme();
  const textContent =
    label ?? (typeof children === "string" ? children : undefined);

  return (
    <box
      paddingX={tokens.density.paddingX}
      backgroundColor={isActive ? tokens.colors.primary : tokens.colors.surface}
      borderColor={isActive ? tokens.colors.primary : undefined}
      borderStyle={isActive ? tokens.borders.style : undefined}
      {...props}
    >
      {textContent !== undefined ? (
        <text
          content={textContent}
          fg={
            isActive
              ? tokens.colors.primaryForeground
              : tokens.colors.foreground
          }
        />
      ) : (
        children
      )}
    </box>
  );
}

export function PaginationPrevious({
  label = "‹ Previous",
  children,
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink label={label} {...props}>
      {children}
    </PaginationLink>
  );
}

export function PaginationNext({
  label = "Next ›",
  children,
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink label={label} {...props}>
      {children}
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  label = "...",
  children,
  ...props
}: PaginationEllipsisProps) {
  const tokens = useTheme();
  const textContent =
    label ?? (typeof children === "string" ? children : "...");

  return (
    <box paddingX={tokens.density.paddingX} {...props}>
      <text content={textContent} fg={tokens.colors.mutedForeground} />
      {typeof children !== "string" && children}
    </box>
  );
}
