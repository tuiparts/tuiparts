/** @jsxImportSource @opentui/react */

import type { ASCIIFontName, BoxOptions, ColorInput } from "@opentui/core";
import { useTheme } from "./use-theme";

export interface ASCIIBannerProps extends BoxOptions {
  text?: string;
  font?: ASCIIFontName;
  subtitle?: string;
  color?: ColorInput | ColorInput[];
}

export function ASCIIBanner({
  text = "",
  font = "block",
  subtitle,
  color,
  ...props
}: ASCIIBannerProps) {
  const tokens = useTheme();

  return (
    <box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingY={1}
      {...props}
    >
      <ascii-font
        text={text}
        font={font}
        color={color ?? tokens.colors.primary}
      />
      {subtitle !== undefined && (
        <text content={subtitle} fg={tokens.colors.mutedForeground} />
      )}
    </box>
  );
}
