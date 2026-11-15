import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextAttributes,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

/** Options for creating an imperative Card container. */
export type CardOptions = BoxOptions;

/** Options for creating an imperative Card Header. */
export type CardHeaderOptions = BoxOptions;

/** Options for creating an imperative Card Title. */
export type CardTitleOptions = TextOptions;

/** Options for creating an imperative Card Description. */
export type CardDescriptionOptions = TextOptions;

/** Options for creating an imperative Card Content container. */
export type CardContentOptions = BoxOptions;

/** Options for creating an imperative Card Footer. */
export type CardFooterOptions = BoxOptions;

class CardRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: CardOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      backgroundColor: options.backgroundColor ?? tokens.colors.surface,
      borderColor: options.borderColor ?? tokens.colors.border,
      borderStyle: options.borderStyle ?? tokens.borders.style,
      flexDirection: options.flexDirection ?? "column",
      padding: options.padding ?? 1,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
      if (options.borderColor === undefined) {
        this.borderColor = currentTokens.colors.border;
      }
      if (options.borderStyle === undefined) {
        this.borderStyle = currentTokens.borders.style;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

class CardTitleRecipeRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: CardTitleOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      attributes: options.attributes ?? TextAttributes.BOLD,
      fg: options.fg ?? tokens.colors.foreground,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.fg === undefined) {
        this.fg = currentTokens.colors.foreground;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

class CardDescriptionRecipeRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: CardDescriptionOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      attributes: options.attributes ?? TextAttributes.DIM,
      fg: options.fg ?? tokens.colors.mutedForeground,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.fg === undefined) {
        this.fg = currentTokens.colors.mutedForeground;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Card Root container. */
export function createCard(
  ctx: RenderContext,
  options: CardOptions = {},
): BoxRenderable {
  return new CardRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Card Header layout. */
export function createCardHeader(
  ctx: RenderContext,
  options: CardHeaderOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    gap: 0,
    ...options,
  });
}

/** Consumer-owned imperative Card Title presentation. */
export function createCardTitle(
  ctx: RenderContext,
  options: CardTitleOptions = {},
): TextRenderable {
  return new CardTitleRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Card Description presentation. */
export function createCardDescription(
  ctx: RenderContext,
  options: CardDescriptionOptions = {},
): TextRenderable {
  return new CardDescriptionRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Card Content container. */
export function createCardContent(
  ctx: RenderContext,
  options: CardContentOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    flexGrow: 1,
    ...options,
  });
}

/** Consumer-owned imperative Card Footer layout. */
export function createCardFooter(
  ctx: RenderContext,
  options: CardFooterOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    justifyContent: "flex-end",
    ...options,
  });
}
