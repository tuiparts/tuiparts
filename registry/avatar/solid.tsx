/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { TextAttributes } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export type AvatarSize = "default" | "lg" | "sm";

export interface AvatarProps extends BoxOptions {
  children?: JSX.Element;
  size?: AvatarSize;
}

export interface AvatarFallbackProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

export interface AvatarImageProps extends BoxOptions {
  children?: JSX.Element;
}

const sizeDimensions: Record<AvatarSize, { height: number; width: number }> = {
  default: { height: 3, width: 6 },
  lg: { height: 4, width: 8 },
  sm: { height: 1, width: 4 },
};

/** Consumer-owned Solid Avatar container. */
export function Avatar(props: AvatarProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "backgroundColor",
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
    "height",
    "justifyContent",
    "size",
    "width",
  ]);
  const tokens = useTheme();
  const size = () => local.size ?? "default";
  const dims = () => sizeDimensions[size()];

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      backgroundColor={local.backgroundColor ?? tokens().colors.surface}
      border={local.border ?? size() !== "sm"}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      flexDirection={local.flexDirection ?? "row"}
      height={local.height ?? dims().height}
      justifyContent={local.justifyContent ?? "center"}
      width={local.width ?? dims().width}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid Avatar Fallback initials presentation. */
export function AvatarFallback(props: AvatarFallbackProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "children",
    "content",
    "flexDirection",
    "justifyContent",
    "textOptions",
  ]);
  const tokens = useTheme();

  if (local.children) {
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

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      flexDirection={local.flexDirection ?? "row"}
      justifyContent={local.justifyContent ?? "center"}
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

/** Consumer-owned Solid Avatar Image container. */
export function AvatarImage(props: AvatarImageProps) {
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
