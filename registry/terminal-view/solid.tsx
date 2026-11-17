/** @jsxImportSource @opentui/solid */

import type { BoxOptions } from "@opentui/core";
import { For, type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface TerminalViewProps extends BoxOptions {
  title?: string;
  lines?: string[];
  prompt?: string;
  showControls?: boolean;
  children?: JSX.Element;
}

export function TerminalView(props: TerminalViewProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "title",
    "lines",
    "prompt",
    "showControls",
    "children",
    "borderColor",
    "backgroundColor",
  ]);
  const tokens = useTheme();

  return (
    <box
      borderStyle={tokens().borders.style}
      borderColor={local.borderColor ?? tokens().colors.border}
      backgroundColor={local.backgroundColor ?? tokens().colors.background}
      flexDirection="column"
      {...rest}
    >
      <box
        height={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingX={1}
      >
        {local.showControls !== false ? (
          <text content="● ● ●" fg={tokens().colors.mutedForeground} />
        ) : (
          <box width={5} />
        )}
        <text
          content={local.title ?? "terminal"}
          fg={tokens().colors.foreground}
        />
        <box width={5} />
      </box>
      <box flexDirection="column" flexGrow={1} paddingX={1} paddingY={0}>
        <For each={local.lines ?? []}>{(line) => <text content={line} />}</For>
        {local.children}
        {local.prompt !== undefined && (
          <box flexDirection="row" alignItems="center" gap={1}>
            <text content={local.prompt} fg={tokens().colors.primary} />
            <text content="█" fg={tokens().colors.foreground} />
          </box>
        )}
      </box>
    </box>
  );
}
