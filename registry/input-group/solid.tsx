/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface InputGroupProps extends BoxOptions {
  children?: JSX.Element;
}

export interface InputGroupAddonProps extends BoxOptions {
  children?: JSX.Element;
}

export interface InputGroupTextProps extends BoxOptions {
  children?: JSX.Element;
  content?: string;
  textOptions?: TextOptions;
}

/** Consumer-owned Solid InputGroup container. */
export function InputGroup(props: InputGroupProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "border",
    "borderColor",
    "borderStyle",
    "children",
    "flexDirection",
  ]);
  const tokens = useTheme();

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      border={local.border ?? true}
      borderColor={local.borderColor ?? tokens().colors.border}
      borderStyle={local.borderStyle ?? tokens().borders.style}
      flexDirection={local.flexDirection ?? "row"}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid InputGroup Addon container. */
export function InputGroupAddon(props: InputGroupAddonProps) {
  const [local, root] = splitProps(props, [
    "alignItems",
    "backgroundColor",
    "children",
    "flexDirection",
    "paddingX",
  ]);
  const tokens = useTheme();

  return (
    <box
      alignItems={local.alignItems ?? "center"}
      backgroundColor={local.backgroundColor ?? tokens().colors.surface}
      flexDirection={local.flexDirection ?? "row"}
      paddingX={local.paddingX ?? 1}
      {...root}
    >
      {local.children}
    </box>
  );
}

/** Consumer-owned Solid InputGroup Text presentation. */
export function InputGroupText(props: InputGroupTextProps) {
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
        fg={local.textOptions?.fg ?? tokens().colors.mutedForeground}
        {...local.textOptions}
      />
    </box>
  );
}
