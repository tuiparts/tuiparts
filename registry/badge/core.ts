import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export type BadgeIntent = "danger" | "neutral" | "success" | "warning";
export type BadgeSize = "compact" | "comfortable";

export interface BadgeOptions extends BoxOptions {
  intent?: BadgeIntent;
  label: string;
  labelOptions?: Omit<TextOptions, "content">;
  size?: BadgeSize;
}

const palettes = (colors: Tokens["colors"]) => ({
  danger: {
    background: colors.destructive,
    foreground: colors.destructiveForeground,
  },
  neutral: { background: colors.surface, foreground: colors.foreground },
  success: { background: colors.success, foreground: colors.successForeground },
  warning: {
    background: colors.warning,
    foreground: colors.warningForeground,
  },
});

class BadgeRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: BadgeOptions) {
    const {
      intent = "neutral",
      label,
      labelOptions,
      size = "compact",
      ...rootOptions
    } = options;
    const tokens = theme.get();
    super(ctx, {
      paddingX:
        size === "comfortable"
          ? tokens.density.comfortablePaddingX
          : tokens.density.paddingX,
      ...rootOptions,
    });
    const text = new TextRenderable(ctx, {
      content: label,
      ...labelOptions,
    });
    this.add(text);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      const palette = palettes(tokens.colors)[intent];
      if (rootOptions.backgroundColor === undefined)
        this.backgroundColor = palette.background;
      if (labelOptions?.fg === undefined) text.fg = palette.foreground;
    };
    applyStyle(tokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe composed from ordinary OpenTUI Renderables. */
export function createBadge(
  ctx: RenderContext,
  options: BadgeOptions,
): BoxRenderable {
  return new BadgeRecipeRenderable(ctx, options);
}
