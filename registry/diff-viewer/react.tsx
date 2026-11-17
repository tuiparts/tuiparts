/** @jsxImportSource @opentui/react */

import type { BoxOptions } from "@opentui/core";
import { useTheme } from "./use-theme";

export interface DiffViewerProps extends BoxOptions {
  diff?: string;
  filetype?: string;
  title?: string;
  view?: "split" | "unified";
}

export function DiffViewer({
  diff = "",
  filetype,
  title,
  view = "unified",
  ...props
}: DiffViewerProps) {
  const tokens = useTheme();

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
          <text
            content={view.toUpperCase()}
            fg={tokens.colors.mutedForeground}
          />
        </box>
      )}
      <diff diff={diff} view={view} filetype={filetype} flexGrow={1} />
    </box>
  );
}
