/** @jsxImportSource @opentui/solid */

import type { ASCIIFontName, BoxOptions, ColorInput } from "@opentui/core";
import { type JSX, splitProps } from "solid-js";
import { useTheme } from "./use-theme";

export interface ASCIIBannerProps extends BoxOptions {
  text?: string;
  font?: ASCIIFontName;
  subtitle?: string;
  color?: ColorInput | ColorInput[];
}

export function ASCIIBanner(props: ASCIIBannerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "text",
    "font",
    "subtitle",
    "color",
  ]);
  const tokens = useTheme();

  return (
    <box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingY={1}
      {...rest}
    >
      <ascii_font
        text={local.text ?? ""}
        font={local.font ?? "block"}
        color={local.color ?? tokens().colors.primary}
      />
      {local.subtitle !== undefined && (
        <text content={local.subtitle} fg={tokens().colors.mutedForeground} />
      )}
    </box>
  );
}
