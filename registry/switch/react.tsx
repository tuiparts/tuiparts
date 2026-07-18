/** @jsxImportSource @opentui/react */

import { Switch as SwitchPrimitive } from "@tuiparts/react/switch";
import { useTheme } from "./use-theme";

export interface SwitchProps
  extends Omit<SwitchPrimitive.Root.Props, "children"> {
  density?: "compact" | "comfortable";
  label: string;
  symbols?: "round" | "ascii";
}

const symbolSets = {
  round: { thumb: "●", track: "─" },
  ascii: { thumb: "*", track: "-" },
} as const;

/** Consumer-owned React recipe installed on packaged Switch behavior. */
export function Switch({
  density = "compact",
  label,
  symbols,
  disabled,
  ...props
}: SwitchProps) {
  const tokens = useTheme();
  const trackWidth = density === "comfortable" ? 5 : 3;
  const glyphs = symbols
    ? symbolSets[symbols]
    : { thumb: tokens.glyphs.thumb, track: tokens.glyphs.track };

  return (
    <SwitchPrimitive.Root
      flexDirection="row"
      gap={density === "comfortable" ? 2 : 1}
      backgroundColor="transparent"
      disabled={disabled}
      {...props}
    >
      {(state) => (
        <>
          <box
            width={trackWidth}
            height={1}
            position="relative"
            backgroundColor="transparent"
          >
            <text
              content={glyphs.track.repeat(trackWidth)}
              fg={tokens.colors.border}
            />
            <SwitchPrimitive.Thumb
              width={1}
              height={1}
              position="absolute"
              left={state.checked ? trackWidth - 1 : 0}
            >
              <text content={glyphs.thumb} fg={tokens.colors.primary} />
            </SwitchPrimitive.Thumb>
          </box>
          <text
            content={label}
            fg={
              state.disabled
                ? tokens.colors.disabledForeground
                : state.focused
                  ? tokens.colors.focus
                  : tokens.colors.foreground
            }
          />
        </>
      )}
    </SwitchPrimitive.Root>
  );
}
