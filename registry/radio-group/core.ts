import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  RadioIndicatorRenderable,
  RadioRootRenderable,
} from "@tuiparts/core/radio";
import {
  RadioGroupRenderable,
  type RadioGroupStore,
  type RadioGroupStoreOptions,
} from "@tuiparts/core/radio-group";
import { type Tokens, theme } from "./theme";

export interface RadioGroupOptions extends RadioGroupStoreOptions {
  gap?: BoxOptions["gap"];
  orientation?: "horizontal" | "vertical";
}

export interface RadioGroupItemOptions {
  disabled?: boolean;
  label: string;
  mark?: string;
  value: string;
}

/** Consumer-owned imperative recipe using the packaged collection parts. */
export function createRadioGroup(
  ctx: RenderContext,
  options: RadioGroupOptions = {},
): RadioGroupRenderable {
  const { gap = 0, orientation = "vertical", ...storeOptions } = options;
  return new RadioGroupRenderable(ctx, {
    ...storeOptions,
    backgroundColor: "transparent",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    gap,
  });
}

class RadioGroupItemRecipeRenderable extends RadioRootRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    store: RadioGroupStore,
    options: RadioGroupItemOptions,
  ) {
    const tokens = theme.get();
    super(ctx, {
      store,
      value: options.value,
      disabled: options.disabled,
      backgroundColor: "transparent",
      flexDirection: "row",
      gap: 1,
    });
    const markCell = new BoxRenderable(ctx, { width: 1 });
    const indicator = new RadioIndicatorRenderable(ctx, { radio: this });
    const mark = new TextRenderable(ctx, {
      content: options.mark ?? tokens.glyphs.radio,
      fg: tokens.colors.primary,
    });
    indicator.add(mark);
    markCell.add(indicator);
    this.add(markCell);
    const label = new TextRenderable(ctx, {
      content: options.label,
      fg: options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground,
    });
    this.add(label);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      mark.content = options.mark ?? tokens.glyphs.radio;
      mark.fg = tokens.colors.primary;
      label.fg = options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground;
    };
    applyStyle(tokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createRadioGroupItem(
  ctx: RenderContext,
  store: RadioGroupStore,
  options: RadioGroupItemOptions,
): RadioRootRenderable {
  return new RadioGroupItemRecipeRenderable(ctx, store, options);
}
