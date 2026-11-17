/** @jsxImportSource @opentui/solid */

import { type BoxOptions, DiffRenderable } from "@opentui/core";
import { useRenderer } from "@opentui/solid";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface DiffViewerProps extends BoxOptions {
  diff?: string;
  filetype?: string;
  title?: string;
  view?: "split" | "unified";
}

export function DiffViewer(props: DiffViewerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "diff",
    "filetype",
    "title",
    "view",
    "borderColor",
    "backgroundColor",
  ]);
  const tokens = useTheme();
  const renderer = useRenderer();

  const diffElement = new DiffRenderable(renderer, {
    diff: local.diff ?? "",
    filetype: local.filetype,
    view: local.view ?? "unified",
    flexGrow: 1,
  });

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
          <text
            content={(local.view ?? "unified").toUpperCase()}
            fg={tokens().colors.mutedForeground}
          />
        </box>
      )}
      {diffElement}
    </box>
  );
}
