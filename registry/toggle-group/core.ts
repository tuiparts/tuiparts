import { type RenderContext, TextRenderable } from "@opentui/core";
import { ToggleRenderable, type ToggleState } from "@tuiparts/core/toggle";
import {
  type ToggleGroupOptions as PrimitiveToggleGroupOptions,
  ToggleGroupRenderable,
  type ToggleGroupStore,
} from "@tuiparts/core/toggle-group";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative ToggleGroup layout. */
export type ToggleGroupOptions = Omit<PrimitiveToggleGroupOptions, "store">;

/** Options for one consumer-owned imperative ToggleGroup item. */
export interface ToggleGroupItemOptions {
  disabled?: boolean;
  label: string;
  value: string;
}

class ToggleGroupItemRecipeRenderable extends ToggleRenderable {
  private readonly unsubscribeRecipe: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    store: ToggleGroupStore,
    options: ToggleGroupItemOptions,
  ) {
    const tokens = theme.get();
    super(ctx, {
      disabled: options.disabled,
      group: store,
      height: 1,
      paddingX: tokens.density.paddingX,
      value: options.value,
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

/** Consumer-owned imperative ToggleGroup layout. */
export function createToggleGroup(
  ctx: RenderContext,
  options: ToggleGroupOptions = {},
): ToggleGroupRenderable {
  return new ToggleGroupRenderable(ctx, {
    ...options,
    flexDirection: options.orientation === "vertical" ? "column" : "row",
    gap: options.gap ?? 1,
  });
}

/** Consumer-owned imperative ToggleGroup item presentation. */
export function createToggleGroupItem(
  ctx: RenderContext,
  store: ToggleGroupStore,
  options: ToggleGroupItemOptions,
): ToggleRenderable {
  return new ToggleGroupItemRecipeRenderable(ctx, store, options);
}
