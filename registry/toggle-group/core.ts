import { type RenderContext, TextRenderable } from "@opentui/core";
import { ToggleRenderable, type ToggleState } from "@tuiparts/core/toggle";
import {
  type ToggleGroupOptions as PrimitiveToggleGroupOptions,
  ToggleGroupRenderable,
  type ToggleGroupStore,
} from "@tuiparts/core/toggle-group";

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

  constructor(
    ctx: RenderContext,
    store: ToggleGroupStore,
    options: ToggleGroupItemOptions,
  ) {
    super(ctx, {
      disabled: options.disabled,
      group: store,
      height: 1,
      paddingX: 1,
      value: options.value,
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
