import {
  type ASCIIFontName,
  ASCIIFontRenderable,
  type BoxOptions,
  BoxRenderable,
  type ColorInput,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface ASCIIBannerOptions extends BoxOptions {
  text?: string;
  font?: ASCIIFontName;
  subtitle?: string;
  color?: ColorInput | ColorInput[];
}

class ASCIIBannerRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;
  public readonly fontRenderable: ASCIIFontRenderable;

  constructor(ctx: RenderContext, options: ASCIIBannerOptions = {}) {
    const {
      text = "",
      font = "block",
      subtitle,
      color,
      ...boxOptions
    } = options;
    const initialTokens = theme.get();

    super(ctx, {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingY: 1,
      ...boxOptions,
    });

    this.fontRenderable = new ASCIIFontRenderable(ctx, {
      text,
      font,
      color: color ?? initialTokens.colors.primary,
    });
    this.add(this.fontRenderable);

    let subtitleRenderable: TextRenderable | undefined;
    if (subtitle !== undefined) {
      subtitleRenderable = new TextRenderable(ctx, { content: subtitle });
      this.add(subtitleRenderable);
    }

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (color === undefined) {
        this.fontRenderable.color = tokens.colors.primary;
      }
      if (subtitleRenderable) {
        subtitleRenderable.fg = tokens.colors.mutedForeground;
      }
    };
    applyStyle(initialTokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createASCIIBanner(
  ctx: RenderContext,
  options: ASCIIBannerOptions = {},
): BoxRenderable {
  return new ASCIIBannerRenderable(ctx, options);
}
