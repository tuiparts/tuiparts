import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  SliderRangeRenderable,
  type SliderRootOptions,
  SliderRootRenderable,
  SliderThumbRenderable,
  SliderTrackRenderable,
} from "@tuiparts/core/slider";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative Slider Recipe. */
export interface SliderOptions extends Omit<SliderRootOptions, "store"> {
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

class SliderRecipeRenderable extends SliderRootRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: SliderOptions) {
    const {
      formatValue = String,
      label,
      orientation = "horizontal",
      thumbMark,
      trackMark,
      trackSize = 20,
      ...rootOptions
    } = options;
    super(ctx, {
      ...rootOptions,
      flexDirection: orientation === "vertical" ? "row" : "column",
      gap: 1,
      orientation,
    });
    const labelText = new TextRenderable(ctx, { content: "" });
    const track = new SliderTrackRenderable(ctx, {
      height: orientation === "vertical" ? trackSize : 1,
      position: "relative",
      store: this.store,
      width: orientation === "vertical" ? 1 : trackSize,
    });
    const trackText = new TextRenderable(ctx, {
      content: "",
      left: 0,
      position: "absolute",
      top: 0,
    });
    const range = new SliderRangeRenderable(ctx, {
      left: 0,
      position: "absolute",
      store: this.store,
      top: 0,
    });
    const rangeText = new TextRenderable(ctx, { content: "" });
    const thumb = new SliderThumbRenderable(ctx, {
      height: 1,
      position: "absolute",
      store: this.store,
      width: 1,
    });
    const thumbText = new TextRenderable(ctx, { content: "" });
    range.add(rangeText);
    thumb.add(thumbText);
    track.add(trackText);
    track.add(range);
    track.add(thumb);
    this.add(labelText);
    this.add(track);

    const apply = (tokens: Readonly<Tokens>) => {
      const state = this.getState();
      const ratio =
        state.max === state.min
          ? 0
          : (state.value - state.min) / (state.max - state.min);
      const offset = Math.round(ratio * (trackSize - 1));
      const resolvedTrackMark = trackMark ?? tokens.glyphs.track;
      const resolvedThumbMark = thumbMark ?? tokens.glyphs.thumb;
      const vertical = state.orientation === "vertical";
      const thumbOffset = vertical ? trackSize - 1 - offset : offset;
      const filled = vertical ? trackSize - thumbOffset : thumbOffset + 1;
      const line = (mark: string, length: number) =>
        vertical
          ? Array.from({ length }, () => mark).join("\n")
          : mark.repeat(length);

      this.flexDirection = vertical ? "row" : "column";
      track.width = vertical ? 1 : trackSize;
      track.height = vertical ? trackSize : 1;
      trackText.content = line(resolvedTrackMark, trackSize);
      rangeText.content = line(resolvedTrackMark, filled);
      range.width = vertical ? 1 : filled;
      range.height = vertical ? filled : 1;
      range.left = 0;
      range.top = vertical ? thumbOffset : 0;
      thumb.left = vertical ? 0 : thumbOffset;
      thumb.top = vertical ? thumbOffset : 0;
      thumbText.content = resolvedThumbMark;
      labelText.content = `${label}: ${formatValue(state.value)}`;
      labelText.fg = state.disabled
        ? tokens.colors.disabledForeground
        : state.focused
          ? tokens.colors.focus
          : tokens.colors.foreground;
      trackText.fg = tokens.colors.border;
      rangeText.fg = tokens.colors.primary;
      thumbText.fg = state.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.primary;
    };
    apply(theme.get());
    this.unsubscribeState = this.store.subscribe(() => apply(theme.get()));
    this.unsubscribeTheme = theme.subscribe(() => apply(theme.get()));
  }

  override endCoordinationLifetime(): void {
    this.unsubscribeState();
    this.unsubscribeTheme();
    super.endCoordinationLifetime();
  }
}

/** Creates a complete imperative Slider Recipe. */
export function createSlider(
  ctx: RenderContext,
  options: SliderOptions,
): SliderRootRenderable {
  return new SliderRecipeRenderable(ctx, options);
}
