/** @jsxImportSource @opentui/solid */

import { type BoxOptions, SyntaxStyle } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface MarkdownViewerProps extends BoxOptions {
  content?: string;
  syntaxStyle?: SyntaxStyle;
  title?: string;
}

export function MarkdownViewer(props: MarkdownViewerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "content",
    "syntaxStyle",
    "title",
    "borderColor",
    "backgroundColor",
  ]);
  const tokens = useTheme();
  const resolvedStyle = () => local.syntaxStyle ?? SyntaxStyle.create();

  return (
    <box
      borderStyle={tokens().borders.style}
      borderColor={local.borderColor ?? tokens().colors.border}
      backgroundColor={local.backgroundColor ?? tokens().colors.background}
      flexDirection="column"
      {...rest}
    >
      {local.title !== undefined && (
        <box
          height={1}
          flexDirection="row"
          justifyContent="space-between"
          paddingX={1}
        >
          <text content={local.title} fg={tokens().colors.foreground} />
          <text content="MD" fg={tokens().colors.mutedForeground} />
        </box>
      )}
      <markdown
        content={local.content ?? ""}
        syntaxStyle={resolvedStyle()}
        flexGrow={1}
      />
    </box>
  );
}
