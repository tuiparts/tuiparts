/** @jsxImportSource @opentui/solid */

import { Slider as Primitive } from "@tuiparts/solid/slider";
import { splitProps } from "solid-js";
import { useTheme } from "./use-theme";

/** Props for the consumer-owned Solid Slider Recipe. */
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

interface SliderPartsProps {
  formatValue: (value: number) => string;
  label: string;
  state: Primitive.Root.State;
  thumbMark?: string;
  trackMark?: string;
  trackSize: number;
}

function SliderParts(props: SliderPartsProps) {
  const tokens = useTheme();
  const vertical = () => props.state.orientation === "vertical";
  const offset = () => {
    const ratio =
      props.state.max === props.state.min
        ? 0
        : (props.state.value - props.state.min) /
          (props.state.max - props.state.min);
    return Math.round(ratio * (props.trackSize - 1));
  };
  const thumbOffset = () =>
    vertical() ? props.trackSize - 1 - offset() : offset();
  const filled = () =>
    vertical() ? props.trackSize - thumbOffset() : thumbOffset() + 1;
  const line = (mark: string, length: number) =>
    vertical()
      ? Array.from({ length }, () => mark).join("\n")
      : mark.repeat(length);
  const trackMark = () => props.trackMark ?? tokens().glyphs.track;
  const thumbMark = () => props.thumbMark ?? tokens().glyphs.thumb;
  return (
    <>
      <text
        content={`${props.label}: ${props.formatValue(props.state.value)}`}
        fg={
          props.state.disabled
            ? tokens().colors.disabledForeground
            : props.state.focused
              ? tokens().colors.focus
              : tokens().colors.foreground
        }
      />
      <Primitive.Track
        height={vertical() ? props.trackSize : 1}
        position="relative"
        width={vertical() ? 1 : props.trackSize}
      >
        <text
          content={line(trackMark(), props.trackSize)}
          fg={tokens().colors.border}
          left={0}
          position="absolute"
          top={0}
        />
        <Primitive.Range
          height={vertical() ? filled() : 1}
          left={0}
          position="absolute"
          top={vertical() ? thumbOffset() : 0}
          width={vertical() ? 1 : filled()}
        >
          <text
            content={line(trackMark(), filled())}
            fg={tokens().colors.primary}
          />
        </Primitive.Range>
        <Primitive.Thumb
          height={1}
          left={vertical() ? 0 : thumbOffset()}
          position="absolute"
          top={vertical() ? thumbOffset() : 0}
          width={1}
        >
          <text
            content={thumbMark()}
            fg={
              props.state.disabled
                ? tokens().colors.disabledForeground
                : tokens().colors.primary
            }
          />
        </Primitive.Thumb>
      </Primitive.Track>
    </>
  );
}

/** Consumer-owned Solid Slider composition. */
export function Slider(props: SliderProps) {
  const [recipe, root] = splitProps(props, [
    "formatValue",
    "label",
    "thumbMark",
    "trackMark",
    "trackSize",
  ]);
  return (
    <Primitive.Root
      flexDirection={root.orientation === "vertical" ? "row" : "column"}
      gap={1}
      {...root}
    >
      {(state: Primitive.Root.State) => (
        <SliderParts
          formatValue={recipe.formatValue ?? String}
          label={recipe.label}
          state={state}
          thumbMark={recipe.thumbMark}
          trackMark={recipe.trackMark}
          trackSize={recipe.trackSize ?? 20}
        />
      )}
    </Primitive.Root>
  );
}
