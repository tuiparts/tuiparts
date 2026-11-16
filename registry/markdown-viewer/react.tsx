/** @jsxImportSource @opentui/react */

import { type BoxOptions, SyntaxStyle } from "@opentui/core";
import { useMemo } from "react";
import { useTheme } from "./use-theme";

export interface MarkdownViewerProps extends BoxOptions {
  content?: string;
  syntaxStyle?: SyntaxStyle;
  title?: string;
}

export function MarkdownViewer({
  content = "",
  syntaxStyle,
  title,
  ...props
}: MarkdownViewerProps) {
  const tokens = useTheme();
  const resolvedStyle = useMemo(
    () => syntaxStyle ?? SyntaxStyle.create(),
    [syntaxStyle],
  );

  return (
    <box
      borderStyle={tokens.borders.style}
      borderColor={props.borderColor ?? tokens.colors.border}
      backgroundColor={props.backgroundColor ?? tokens.colors.background}
      flexDirection="column"
      {...props}
    >
      {title !== undefined && (
        <box
          height={1}
          flexDirection="row"
          justifyContent="space-between"
          paddingX={1}
        >
          <text content={title} fg={tokens.colors.foreground} />
          <text content="MD" fg={tokens.colors.mutedForeground} />
        </box>
      )}
      <markdown content={content} syntaxStyle={resolvedStyle} flexGrow={1} />
    </box>
  );
}
