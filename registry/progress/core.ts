import type { RenderContext } from "@opentui/core";
import {
  type ProgressIndicatorOptions,
  ProgressIndicatorRenderable,
  type ProgressRootOptions,
  ProgressRootRenderable,
} from "@tuiparts/core/progress";
import { type Tokens, theme } from "./theme";

export interface ProgressOptions extends ProgressRootOptions {
  indicatorOptions?: Omit<ProgressIndicatorOptions, "store">;
}

class ProgressRecipeRenderable extends ProgressRootRenderable {
  private readonly unsubscribeTheme: () => void;
  private readonly indicator: ProgressIndicatorRenderable;

  constructor(ctx: RenderContext, options: ProgressOptions = {}) {
    const { indicatorOptions, ...rootOptions } = options;
    const tokens = theme.get();

    super(ctx, {
      backgroundColor: rootOptions.backgroundColor ?? tokens.colors.surface,
      height: rootOptions.height ?? 1,
      ...rootOptions,
    });

    this.indicator = new ProgressIndicatorRenderable(ctx, {
      backgroundColor:
        indicatorOptions?.backgroundColor ?? tokens.colors.primary,
      height: indicatorOptions?.height ?? 1,
      store: this._store,
      ...indicatorOptions,
    });
    this.add(this.indicator);

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (rootOptions.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
      if (indicatorOptions?.backgroundColor === undefined) {
        this.indicator.backgroundColor = currentTokens.colors.primary;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  get indicatorRenderable(): ProgressIndicatorRenderable {
    return this.indicator;
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Progress recipe built on the tuiparts.sh packaged Primitive. */
export function createProgress(
  ctx: RenderContext,
  options: ProgressOptions = {},
): ProgressRootRenderable {
  return new ProgressRecipeRenderable(ctx, options);
}
