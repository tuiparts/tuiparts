import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type ToggleChangeDetails,
  ToggleRenderable,
  type ToggleState,
} from "@tuiparts/core/toggle";

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
    const applyState = (state: ToggleState) => {
      this.backgroundColor = state.pressed
        ? "#2563EB"
        : state.focused
          ? "#404040"
          : "transparent";
      label.fg = state.disabled ? "#737373" : "#F5F5F5";
    };
    applyState(this.getState());
    this.unsubscribeRecipe = this.subscribe(applyState);
  }

  override destroy(): void {
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
