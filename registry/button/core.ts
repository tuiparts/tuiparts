import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type ButtonPressDetails,
  ButtonRootRenderable,
  type ButtonState,
  ButtonStore,
} from "@opentui-ui/core/button";

export interface ButtonOptions {
  disabled?: boolean;
  intent?: "neutral" | "primary";
  label: string;
  onPress?: (details: ButtonPressDetails) => void;
  size?: "compact" | "comfortable";
}

const backgrounds = {
  neutral: "#404040",
  primary: "#2563EB",
} as const;

class ButtonRecipeRenderable extends ButtonRootRenderable {
  private readonly unsubscribeRecipe: () => void;

  constructor(ctx: RenderContext, options: ButtonOptions) {
    const store = new ButtonStore(options);
    const intent = options.intent ?? "primary";
    super(ctx, {
      backgroundColor: backgrounds[intent],
      paddingX: options.size === "comfortable" ? 2 : 1,
      store,
    });
    const label = new TextRenderable(ctx, {
      content: options.label,
      fg: "#F5F5F5",
    });
    this.add(label);

    const applyState = (state: ButtonState) => {
      this.backgroundColor = state.disabled
        ? "#262626"
        : state.pressed
          ? "#1D4ED8"
          : state.focused
            ? "#3B82F6"
            : backgrounds[intent];
      label.fg = state.disabled ? "#737373" : "#F5F5F5";
    };
    applyState(store.state);
    this.unsubscribeRecipe = store.subscribe(applyState);
  }

  override destroy(): void {
    this.unsubscribeRecipe();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe using packaged Button behavior. */
export function createButton(
  ctx: RenderContext,
  options: ButtonOptions,
): ButtonRootRenderable {
  return new ButtonRecipeRenderable(ctx, options);
}
