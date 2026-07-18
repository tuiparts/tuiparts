import type { RenderContext } from "@opentui/core";
import {
  type InputOptions as BaseInputOptions,
  InputRenderable,
} from "@tuiparts/core/input";
import { type Tokens, theme, tint } from "./theme";

export interface InputOptions extends BaseInputOptions {}

class InputRecipeRenderable extends InputRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: InputOptions) {
    super(ctx, {
      backgroundColor: "transparent",
      focusedBackgroundColor: "transparent",
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

/** Consumer-owned imperative Input recipe with editable visual defaults. */
export function createInput(
  ctx: RenderContext,
  options: InputOptions = {},
): InputRenderable {
  return new InputRecipeRenderable(ctx, options);
}
