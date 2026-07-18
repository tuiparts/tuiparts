import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type ToggleChangeDetails,
  ToggleRenderable,
  type ToggleState,
} from "@tuiparts/core/toggle";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative Toggle recipe. */
export interface ToggleOptions {
  defaultPressed?: boolean;
  disabled?: boolean;
  label: string;
  onPressedChange?: (pressed: boolean, details: ToggleChangeDetails) => void;
  pressed?: boolean;
}

class ToggleRecipeRenderable extends ToggleRenderable {
  private readonly unsubscribeRecipe: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: ToggleOptions) {
    super(ctx, {
      defaultPressed: options.defaultPressed,
      disabled: options.disabled,
      onPressedChange: options.onPressedChange,
      pressed: options.pressed,
      height: 1,
      paddingX: 1,
    });
    const label = new TextRenderable(ctx, { content: options.label });
    this.add(label);
    const applyStyle = (tokens: Readonly<Tokens>, state: ToggleState) => {
      this.backgroundColor = state.pressed
        ? tokens.colors.primary
        : state.focused
          ? tokens.colors.surface
          : "transparent";
      label.fg = state.disabled
        ? tokens.colors.disabledForeground
        : state.pressed
          ? tokens.colors.primaryForeground
          : tokens.colors.foreground;
    };
    applyStyle(theme.get(), this.getState());
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

/** Consumer-owned imperative Toggle recipe. */
export function createToggle(
  ctx: RenderContext,
  options: ToggleOptions,
): ToggleRenderable {
  return new ToggleRecipeRenderable(ctx, options);
}
