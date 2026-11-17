const lineKey = (line: string, index: number): string => `${index}-${line}`;

/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

export interface TerminalViewProps extends BoxOptions {
  title?: string;
  lines?: string[];
  prompt?: string;
  showControls?: boolean;
  children?: ReactNode;
}

export function TerminalView({
  title = "terminal",
  lines = [],
  prompt,
  showControls = true,
  children,
  ...props
}: TerminalViewProps) {
  const tokens = useTheme();

  return (
    <box
      borderStyle={tokens.borders.style}
      borderColor={props.borderColor ?? tokens.colors.border}
      backgroundColor={props.backgroundColor ?? tokens.colors.background}
      flexDirection="column"
      {...props}
    >
      <box
        height={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingX={1}
      >
        {showControls ? (
          <text content="● ● ●" fg={tokens.colors.mutedForeground} />
        ) : (
          <box width={5} />
        )}
        <text content={title} fg={tokens.colors.foreground} />
        <box width={5} />
      </box>
      <box flexDirection="column" flexGrow={1} paddingX={1} paddingY={0}>
        {lines.map((line, i) => {
          const key = lineKey(line, i);
          return <text key={key} content={line} />;
        })}
        {children}
        {prompt !== undefined && (
          <box flexDirection="row" alignItems="center" gap={1}>
            <text content={prompt} fg={tokens.colors.primary} />
            <text content="█" fg={tokens.colors.foreground} />
          </box>
        )}
      </box>
    </box>
  );
}
