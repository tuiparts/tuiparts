import type { BoxOptions, RenderContext, TextOptions } from "@opentui/core";
import { BoxRenderable, TextAttributes, TextRenderable } from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface EmptyRootOptions extends BoxOptions {}

export interface EmptyTitleOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

export interface EmptyDescriptionOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

/** Root container renderable for empty-state callouts. */
export class EmptyRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: EmptyRootOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      border: options.border ?? true,
      borderColor: options.borderColor ?? tokens.colors.border,
      borderStyle: options.borderStyle ?? tokens.borders.style,
      flexDirection: "column",
      gap: options.gap ?? 1,
      justifyContent: "center",
      padding: options.padding ?? 1,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
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

/** Empty title heading presentation. */
export class EmptyTitleRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: EmptyTitleOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
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

/** Empty description text presentation. */
export class EmptyDescriptionRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: EmptyDescriptionOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      ...boxOptions,
    });

    if (content !== undefined) {
      this.textNode = new TextRenderable(ctx, {
        attributes: textOptions?.attributes ?? TextAttributes.DIM,
        content,
        fg: textOptions?.fg ?? tokens.colors.mutedForeground,
        ...textOptions,
      });
      this.add(this.textNode);
    }

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (this.textNode && textOptions?.fg === undefined) {
        this.textNode.fg = currentTokens.colors.mutedForeground;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Empty container. */
export function createEmpty(
  ctx: RenderContext,
  options: EmptyRootOptions = {},
): EmptyRecipeRenderable {
  return new EmptyRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Empty Header layout. */
export function createEmptyHeader(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "column",
    gap: 0,
    ...options,
  });
}

/** Consumer-owned imperative Empty Media / icon layout. */
export function createEmptyMedia(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...options,
  });
}

/** Consumer-owned imperative Empty Title heading. */
export function createEmptyTitle(
  ctx: RenderContext,
  options: EmptyTitleOptions = {},
): EmptyTitleRecipeRenderable {
  return new EmptyTitleRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Empty Description text. */
export function createEmptyDescription(
  ctx: RenderContext,
  options: EmptyDescriptionOptions = {},
): EmptyDescriptionRecipeRenderable {
  return new EmptyDescriptionRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Empty Content container. */
export function createEmptyContent(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "column",
    gap: 1,
    ...options,
  });
}
