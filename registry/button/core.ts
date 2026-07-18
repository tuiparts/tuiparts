import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type ButtonPressDetails,
  ButtonRenderable,
  type ButtonState,
} from "@tuiparts/core/button";
import { type Tokens, theme, tint } from "./theme";

export interface ButtonOptions {
  disabled?: boolean;
  intent?: "neutral" | "primary";
  label: string;
  onPress?: (details: ButtonPressDetails) => void;
  size?: "compact" | "comfortable";
}

class ButtonRecipeRenderable extends ButtonRenderable {
  private readonly unsubscribeRecipe: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: ButtonOptions) {
    const tokens = theme.get();
    const intent = options.intent ?? "primary";
    super(ctx, {
      disabled: options.disabled,
      onPress: options.onPress,
      paddingX:
        options.size === "comfortable"
          ? tokens.density.comfortablePaddingX
          : tokens.density.paddingX,
    });
    const label = new TextRenderable(ctx, { content: options.label });
    this.add(label);

    const applyStyle = (tokens: Readonly<Tokens>, state: ButtonState) => {
      this.backgroundColor = state.disabled
        ? tokens.colors.disabled
        : state.pressed
          ? tint(tokens.colors.focus, tokens.colors.foreground, 0.3)
          : state.focused
            ? tokens.colors.focus
            : intent === "primary"
              ? tokens.colors.primary
              : tokens.colors.surface;
      label.fg = state.disabled
        ? tokens.colors.disabledForeground
        : intent === "primary"
          ? tokens.colors.primaryForeground
          : tokens.colors.foreground;
    };
    applyStyle(tokens, this.getState());
    this.unsubscribeTheme = theme.subscribe(() =>
      applyStyle(theme.get(), this.getState()),
    );
    this.unsubscribeRecipe = this.subscribe((state) =>
      applyStyle(theme.get(), state),
    );
  }

  override destroy(): void {
    this.unsubscribeTheme();
    this.unsubscribeRecipe();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe using packaged Button behavior. */
export function createButton(
  ctx: RenderContext,
  options: ButtonOptions,
): ButtonRenderable {
  return new ButtonRecipeRenderable(ctx, options);
}
