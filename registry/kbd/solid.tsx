/** @jsxImportSource @opentui/solid */

import type { BoxOptions, TextOptions } from "@opentui/core";
import type { JSX } from "@opentui/solid";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface KbdProps extends BoxOptions {
  children?: JSX.Element;
  keys?: string[];
  label?: string;
  labelOptions?: Omit<TextOptions, "content">;
}

export interface KbdGroupProps extends BoxOptions {
  children?: JSX.Element;
}

function resolveLabel(options: { label?: string; keys?: string[] }): string {
  if (options.label !== undefined) return options.label;
  if (options.keys !== undefined && options.keys.length > 0)
    return options.keys.join("+");
  return "";
}

/** Consumer-owned Solid Kbd recipe composed from ordinary OpenTUI elements. */
export function Kbd(props: KbdProps) {
  const [recipe, root] = splitProps(props, [
    "children",
    "keys",
    "label",
    "labelOptions",
  ]);
  const tokens = useTheme();
  const content = () => resolveLabel(recipe);

  return (
    <box
      backgroundColor={tokens().colors.surface}
      paddingX={tokens().density.paddingX}
      {...root}
    >
      {recipe.children ?? (
        <text
          content={content()}
          fg={tokens().colors.mutedForeground}
          {...recipe.labelOptions}
        />
      )}
    </box>
  );
}

/** Consumer-owned Solid KbdGroup layout for grouping key shortcuts. */
export function KbdGroup(props: KbdGroupProps) {
  const [local, root] = splitProps(props, ["children"]);
  return (
    <box alignItems="center" flexDirection="row" gap={1} {...root}>
      {local.children}
    </box>
  );
}
