/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import type { PropsWithChildren } from "react";
import { useTheme } from "./use-theme";

export type AvatarSize = "default" | "lg" | "sm";

export interface AvatarProps extends PropsWithChildren<BoxOptions> {
  size?: AvatarSize;
}

export interface AvatarFallbackProps extends PropsWithChildren<BoxOptions> {
  content?: string;
  textOptions?: TextOptions;
}

export interface AvatarImageProps extends PropsWithChildren<BoxOptions> {}

const sizeDimensions: Record<AvatarSize, { height: number; width: number }> = {
  default: { height: 3, width: 6 },
  lg: { height: 4, width: 8 },
  sm: { height: 1, width: 4 },
};

/** Consumer-owned React Avatar container. */
export function Avatar({
  alignItems = "center",
  backgroundColor,
  border,
  borderColor,
  borderStyle,
  children,
  flexDirection = "row",
  height,
  justifyContent = "center",
  size = "default",
  width,
  ...props
}: AvatarProps) {
  const tokens = useTheme();
  const dims = sizeDimensions[size];

  return (
    <box
      alignItems={alignItems}
      backgroundColor={backgroundColor ?? tokens.colors.surface}
      border={border ?? size !== "sm"}
      borderColor={borderColor ?? tokens.colors.border}
      borderStyle={borderStyle ?? tokens.borders.style}
      flexDirection={flexDirection}
      height={height ?? dims.height}
      justifyContent={justifyContent}
      width={width ?? dims.width}
      {...props}
    >
      {children}
    </box>
  );
}

/** Consumer-owned React Avatar Fallback initials presentation. */
export function AvatarFallback({
  alignItems = "center",
  children,
  content,
  flexDirection = "row",
  justifyContent = "center",
  textOptions,
  ...props
}: AvatarFallbackProps) {
  const tokens = useTheme();

  return (
    <box
      alignItems={alignItems}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      {...props}
    >
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

/** Consumer-owned React Avatar Image container. */
export function AvatarImage({
  alignItems = "center",
  children,
  flexDirection = "row",
  justifyContent = "center",
  ...props
}: AvatarImageProps) {
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
