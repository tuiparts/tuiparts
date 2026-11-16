import type { BoxOptions, RenderContext, TextOptions } from "@opentui/core";
import { BoxRenderable, TextAttributes, TextRenderable } from "@opentui/core";
import { type Tokens, theme } from "./theme";

export type AvatarSize = "default" | "lg" | "sm";

export interface AvatarRootOptions extends BoxOptions {
  size?: AvatarSize;
}

export interface AvatarFallbackOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

export interface AvatarImageOptions extends BoxOptions {}

const sizeDimensions: Record<AvatarSize, { height: number; width: number }> = {
  default: { height: 3, width: 6 },
  lg: { height: 4, width: 8 },
  sm: { height: 1, width: 4 },
};

/** Consumer-owned imperative Avatar container. */
export class AvatarRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: AvatarRootOptions = {}) {
    const { size = "default", ...boxOptions } = options;
    const tokens = theme.get();
    const dims = sizeDimensions[size];

    super(ctx, {
      alignItems: "center",
      backgroundColor: boxOptions.backgroundColor ?? tokens.colors.surface,
      border: boxOptions.border ?? size !== "sm",
      borderColor: boxOptions.borderColor ?? tokens.colors.border,
      borderStyle: boxOptions.borderStyle ?? tokens.borders.style,
      flexDirection: "row",
      height: boxOptions.height ?? dims.height,
      justifyContent: "center",
      width: boxOptions.width ?? dims.width,
      ...boxOptions,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (boxOptions.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
      if (boxOptions.borderColor === undefined) {
        this.borderColor = currentTokens.colors.border;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Fallback presentation displaying user initials. */
export class AvatarFallbackRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: AvatarFallbackOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      ...boxOptions,
    });

    if (content !== undefined) {
      this.textNode = new TextRenderable(ctx, {
        attributes: textOptions?.attributes ?? TextAttributes.BOLD,
        content,
        fg: textOptions?.fg ?? tokens.colors.foreground,
        ...textOptions,
      });
      this.add(this.textNode);
    }

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (this.textNode && textOptions?.fg === undefined) {
        this.textNode.fg = currentTokens.colors.foreground;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Avatar factory. */
export function createAvatar(
  ctx: RenderContext,
  options: AvatarRootOptions = {},
): AvatarRecipeRenderable {
  return new AvatarRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Avatar Fallback factory. */
export function createAvatarFallback(
  ctx: RenderContext,
  options: AvatarFallbackOptions = {},
): AvatarFallbackRecipeRenderable {
  return new AvatarFallbackRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Avatar Image container. */
export function createAvatarImage(
  ctx: RenderContext,
  options: AvatarImageOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...options,
  });
}
