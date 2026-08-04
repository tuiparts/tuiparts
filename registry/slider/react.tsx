/** @jsxImportSource @opentui/react */

import { Slider as Primitive } from "@tuiparts/react/slider";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned React Slider Recipe. */
export interface SliderProps extends Omit<Primitive.Root.Props, "children"> {
  /** Formats the value displayed beside the label. */
  formatValue?: (value: number) => string;
  /** Label shown with the Slider. */
  label: string;
  /** Number of terminal cells used by Track. */
  trackSize?: number;
  /** Track and Range glyph. */
  trackMark?: string;
  /** Thumb glyph. */
  thumbMark?: string;
}

/** Consumer-owned React Slider composition. */
export function Slider({
  formatValue = String,
  label,
  orientation = "horizontal",
  thumbMark,
  trackMark,
  trackSize = 20,
  ...props
}: SliderProps) {
  const tokens = useTheme();
  const resolvedTrackMark = trackMark ?? tokens.glyphs.track;
  const resolvedThumbMark = thumbMark ?? tokens.glyphs.thumb;
  return (
    <Primitive.Root
      flexDirection={orientation === "vertical" ? "row" : "column"}
      gap={1}
      orientation={orientation}
      {...props}
    >
      {(state: Primitive.Root.State) => {
        const ratio =
          state.max === state.min
            ? 0
            : (state.value - state.min) / (state.max - state.min);
        const offset = Math.round(ratio * (trackSize - 1));
        const vertical = state.orientation === "vertical";
        const thumbOffset = vertical ? trackSize - 1 - offset : offset;
        const filled = vertical ? trackSize - thumbOffset : thumbOffset + 1;
        const line = (mark: string, length: number) =>
          vertical
            ? Array.from({ length }, () => mark).join("\n")
            : mark.repeat(length);
        return (
          <>
            <text
              content={`${label}: ${formatValue(state.value)}`}
              fg={
                state.disabled
                  ? tokens.colors.disabledForeground
                  : state.focused
                    ? tokens.colors.focus
                    : tokens.colors.foreground
              }
            />
            <Primitive.Track
              height={vertical ? trackSize : 1}
              position="relative"
              width={vertical ? 1 : trackSize}
            >
              <text
                content={line(resolvedTrackMark, trackSize)}
                fg={tokens.colors.border}
                left={0}
                position="absolute"
                top={0}
              />
              <Primitive.Range
                height={vertical ? filled : 1}
                left={0}
                position="absolute"
                top={vertical ? thumbOffset : 0}
                width={vertical ? 1 : filled}
              >
                <text
                  content={line(resolvedTrackMark, filled)}
                  fg={tokens.colors.primary}
                />
              </Primitive.Range>
              <Primitive.Thumb
                height={1}
                left={vertical ? 0 : thumbOffset}
                position="absolute"
                top={vertical ? thumbOffset : 0}
                width={1}
              >
                <text
                  content={resolvedThumbMark}
                  fg={
                    state.disabled
                      ? tokens.colors.disabledForeground
                      : tokens.colors.primary
                  }
                />
              </Primitive.Thumb>
            </Primitive.Track>
          </>
        );
      }}
    </Primitive.Root>
  );
}
