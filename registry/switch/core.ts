import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  SwitchRootRenderable,
  SwitchThumbRenderable,
} from "@tuiparts/core/switch";
import { type Tokens, theme } from "./theme";

export interface SwitchOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  density?: "compact" | "comfortable";
  disabled?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
  symbols?: "round" | "ascii";
}

const symbolSets = {
  round: { thumb: "●", track: "─" },
  ascii: { thumb: "*", track: "-" },
} as const;

class SwitchRecipeRenderable extends SwitchRootRenderable {
  private readonly unsubscribeRecipe: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: SwitchOptions) {
    const tokens = theme.get();
    const trackWidth = options.density === "comfortable" ? 5 : 3;
    const resolveSymbols = (tokens: Readonly<Tokens>) =>
      options.symbols
        ? symbolSets[options.symbols]
        : { thumb: tokens.glyphs.thumb, track: tokens.glyphs.track };
    const symbols = resolveSymbols(tokens);
    super(ctx, {
      backgroundColor: "transparent",
      checked: options.checked,
      defaultChecked: options.defaultChecked,
      disabled: options.disabled,
      flexDirection: "row",
      gap: options.density === "comfortable" ? 2 : 1,
      onCheckedChange: options.onCheckedChange,
    });

    const track = new BoxRenderable(ctx, {
      backgroundColor: "transparent",
      height: 1,
      position: "relative",
      width: trackWidth,
    });
    const trackText = new TextRenderable(ctx, {
      content: symbols.track.repeat(trackWidth),
      fg: tokens.colors.border,
    });
    track.add(trackText);
    const thumb = new SwitchThumbRenderable(ctx, {
      height: 1,
      left: this.getState().checked ? trackWidth - 1 : 0,
      position: "absolute",
      store: this.store,
      width: 1,
    });
    const thumbText = new TextRenderable(ctx, {
      content: symbols.thumb,
      fg: tokens.colors.primary,
    });
    thumb.add(thumbText);
    track.add(thumb);
    this.add(track);
    const label = new TextRenderable(ctx, {
      content: options.label,
      fg: options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground,
    });
    this.add(label);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      const symbols = resolveSymbols(tokens);
      trackText.content = symbols.track.repeat(trackWidth);
      trackText.fg = tokens.colors.border;
      thumbText.content = symbols.thumb;
      thumbText.fg = tokens.colors.primary;
      label.fg = options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground;
    };
    applyStyle(tokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
    this.unsubscribeRecipe = this.subscribe((state) => {
      thumb.left = state.checked ? trackWidth - 1 : 0;
    });
  }

  override destroy(): void {
    this.unsubscribeTheme();
    this.unsubscribeRecipe();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe using packaged Switch behavior. */
export function createSwitch(
  ctx: RenderContext,
  options: SwitchOptions,
): SwitchRootRenderable {
  return new SwitchRecipeRenderable(ctx, options);
}
