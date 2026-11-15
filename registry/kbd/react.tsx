/** @jsxImportSource @opentui/react */

import type { BoxOptions, TextOptions } from "@opentui/core";
import type { ReactNode } from "react";
import { useTheme } from "./use-theme";

export interface KbdProps extends BoxOptions {
  children?: ReactNode;
  keys?: string[];
  label?: string;
  labelOptions?: Omit<TextOptions, "content">;
}

export interface KbdGroupProps extends BoxOptions {
  children?: ReactNode;
}

function resolveLabel(options: { label?: string; keys?: string[] }): string {
  if (options.label !== undefined) return options.label;
  if (options.keys !== undefined && options.keys.length > 0)
    return options.keys.join("+");
  return "";
}

/** Consumer-owned React Kbd recipe composed from ordinary OpenTUI elements. */
export function Kbd({
  children,
  keys,
  label,
  labelOptions,
  ...root
}: KbdProps) {
  const tokens = useTheme();
  const content = resolveLabel({ label, keys });

  return (
    <box
      backgroundColor={tokens.colors.surface}
      paddingX={tokens.density.paddingX}
      {...root}
    >
      {content ? (
        <text
          content={content}
          fg={tokens.colors.mutedForeground}
          {...labelOptions}
        />
      ) : (
        children
      )}
    </box>
  );
}

/** Consumer-owned React KbdGroup layout for grouping key shortcuts. */
export function KbdGroup({ children, ...props }: KbdGroupProps) {
  return (
    <box alignItems="center" flexDirection="row" gap={1} {...props}>
      {children}
    </box>
  );
}
