import {
  type BoxOptions,
  BoxRenderable,
  type CliRenderer,
  createTimeline,
  engine,
  type RenderContext,
  type Timeline,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface SkeletonOptions extends BoxOptions {
  /** When true (default), pulses opacity between 1.0 and 0.4 matching shadcn animate-pulse. */
  animate?: boolean;
}

class SkeletonRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;
  private readonly timeline?: Timeline;

  constructor(ctx: RenderContext, options: SkeletonOptions = {}) {
    const tokens = theme.get();
    const {
      animate = true,
      backgroundColor,
      shouldFill = true,
      ...boxOptions
    } = options;

    super(ctx, {
      backgroundColor: backgroundColor ?? tokens.colors.surface,
      shouldFill,
      ...boxOptions,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));

    if (animate) {
      if ("setFrameCallback" in ctx) {
        try {
          engine.attach(ctx as unknown as CliRenderer);
        } catch {}
      }
      this.timeline = createTimeline({ duration: 2000, loop: true }).add(this, {
        opacity: 0.4,
        duration: 1000,
        alternate: true,
        loop: true,
      });
    }
  }

  override destroy(): void {
    if (this.timeline) {
      this.timeline.pause();
      try {
        engine.unregister(this.timeline);
      } catch {}
    }
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Skeleton recipe composed directly from OpenTUI Box. */
export function createSkeleton(
  ctx: RenderContext,
  options: SkeletonOptions = {},
): BoxRenderable {
  return new SkeletonRecipeRenderable(ctx, options);
}
