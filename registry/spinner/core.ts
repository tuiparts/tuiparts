import type { BoxOptions, ColorInput, RenderContext } from "@opentui/core";
import {
  SPINNER_FRAMES,
  type SpinnerFrameChangeHandler,
  SpinnerIndicatorRenderable,
  SpinnerLabelRenderable,
  type SpinnerPreset,
  SpinnerRootRenderable,
} from "@tuiparts/core";
import { type Tokens, theme } from "./theme";

export type SpinnerIntent =
  | "primary"
  | "neutral"
  | "muted"
  | "success"
  | "warning"
  | "danger";

export interface SpinnerOptions extends BoxOptions {
  preset?: SpinnerPreset;
  frames?: readonly string[];
  interval?: number;
  running?: boolean;
  label?: string;
  intent?: SpinnerIntent;
  onFrameChange?: SpinnerFrameChangeHandler;
}

const colorForIntent = (
  colors: Tokens["colors"],
  intent: SpinnerIntent,
): ColorInput => {
  switch (intent) {
    case "primary":
      return colors.primary;
    case "muted":
      return colors.mutedForeground;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "danger":
      return colors.destructive;
    default:
      return colors.foreground;
  }
};

export class SpinnerRecipeRenderable extends SpinnerRootRenderable {
  readonly indicator: SpinnerIndicatorRenderable;
  readonly labelNode?: SpinnerLabelRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: SpinnerOptions = {}) {
    const {
      preset = "braille",
      frames = SPINNER_FRAMES[preset] ?? SPINNER_FRAMES.braille,
      interval,
      running = true,
      label,
      intent = "primary",
      onFrameChange,
      ...boxOptions
    } = options;

    super(ctx, {
      frames,
      interval,
      running,
      onFrameChange,
      flexDirection: "row",
      alignItems: "center",
      gap: label ? 1 : 0,
      ...boxOptions,
    });

    const initialTokens = theme.get();
    const color = colorForIntent(initialTokens.colors, intent);

    this.indicator = new SpinnerIndicatorRenderable(ctx, {
      store: this.currentStore,
      fg: color,
    });
    this.add(this.indicator);

    if (label) {
      this.labelNode = new SpinnerLabelRenderable(ctx, {
        content: label,
        fg: initialTokens.colors.foreground,
      });
      this.add(this.labelNode);
    }

    this.unsubscribeTheme = theme.subscribe(() => {
      const nextTokens = theme.get();
      const nextColor = colorForIntent(nextTokens.colors, intent);
      this.indicator.fg = nextColor;
      if (this.labelNode) {
        this.labelNode.fg = nextTokens.colors.foreground;
      }
    });
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createSpinner(
  ctx: RenderContext,
  options: SpinnerOptions = {},
): SpinnerRecipeRenderable {
  return new SpinnerRecipeRenderable(ctx, options);
}
