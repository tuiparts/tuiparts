import type { RenderContext } from "@opentui/core";
import { type ScrollBoxOptions, ScrollBoxRenderable } from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface ScrollAreaOptions extends ScrollBoxOptions {}

/** Consumer-owned imperative ScrollArea container wrapping OpenTUI's native ScrollBox. */
export class ScrollAreaRecipeRenderable extends ScrollBoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: ScrollAreaOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      border: options.border ?? true,
      borderColor: options.borderColor ?? tokens.colors.border,
      borderStyle: options.borderStyle ?? tokens.borders.style,
      scrollY: options.scrollY ?? true,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.borderColor === undefined) {
        this.borderColor = currentTokens.colors.border;
      }
      if (options.borderStyle === undefined) {
        this.borderStyle = currentTokens.borders.style;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative ScrollArea factory. */
export function createScrollArea(
  ctx: RenderContext,
  options: ScrollAreaOptions = {},
): ScrollAreaRecipeRenderable {
  return new ScrollAreaRecipeRenderable(ctx, options);
}
