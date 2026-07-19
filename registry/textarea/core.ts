import type { RenderContext } from "@opentui/core";
import {
  type TextareaOptions as BaseTextareaOptions,
  TextareaRenderable,
} from "@tuiparts/core/textarea";
import { type Tokens, theme, tint } from "./theme";

/** Options accepted by the imperative Textarea Recipe. */
export interface TextareaOptions extends BaseTextareaOptions {}

class TextareaRecipeRenderable extends TextareaRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TextareaOptions) {
    super(ctx, {
      backgroundColor: "transparent",
      focusedBackgroundColor: "transparent",
      height: 5,
      wrapMode: "word",
      ...options,
    });

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (options.cursorColor === undefined)
        this.cursorColor = tokens.colors.foreground;
      if (options.focusedTextColor === undefined)
        this.focusedTextColor = tint(
          tokens.colors.foreground,
          tokens.colors.focus,
          0.35,
        );
      if (options.placeholderColor === undefined)
        this.placeholderColor = tokens.colors.mutedForeground;
      if (options.selectionBg === undefined)
        this.selectionBg = tint(
          tokens.colors.background,
          tokens.colors.focus,
          0.45,
        );
      if (options.textColor === undefined)
        this.textColor = tokens.colors.foreground;
    };
    applyStyle(theme.get());
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Creates the consumer-owned imperative Textarea Recipe. */
export function createTextarea(
  ctx: RenderContext,
  options: TextareaOptions = {},
): TextareaRenderable {
  return new TextareaRecipeRenderable(ctx, options);
}
