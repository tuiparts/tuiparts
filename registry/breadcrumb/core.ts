import type { BoxOptions, RenderContext, TextOptions } from "@opentui/core";
import { BoxRenderable, TextAttributes, TextRenderable } from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface BreadcrumbLinkOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbPageOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbSeparatorOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

export interface BreadcrumbEllipsisOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

/** Root container renderable for breadcrumb navigation. */
export class BreadcrumbRecipeRenderable extends BoxRenderable {
  constructor(ctx: RenderContext, options: BoxOptions = {}) {
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      ...options,
    });
  }
}

/** Interactive or textual link item in a breadcrumb trail. */
export class BreadcrumbLinkRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: BreadcrumbLinkOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      ...boxOptions,
    });

    if (content !== undefined) {
      this.textNode = new TextRenderable(ctx, {
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

/** Current active page item in a breadcrumb trail. */
export class BreadcrumbPageRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: BreadcrumbPageOptions = {}) {
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

/** Separator glyph between breadcrumb items. */
export class BreadcrumbSeparatorRecipeRenderable extends BoxRenderable {
  readonly textNode: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: BreadcrumbSeparatorOptions = {}) {
    const { content = "›", textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      ...boxOptions,
    });

    this.textNode = new TextRenderable(ctx, {
      content,
      fg: textOptions?.fg ?? tokens.colors.mutedForeground,
      ...textOptions,
    });
    this.add(this.textNode);

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (textOptions?.fg === undefined) {
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

/** Collapsed ellipsis indicator in long breadcrumb trails. */
export class BreadcrumbEllipsisRecipeRenderable extends BoxRenderable {
  readonly textNode: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: BreadcrumbEllipsisOptions = {}) {
    const { content = "…", textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      ...boxOptions,
    });

    this.textNode = new TextRenderable(ctx, {
      content,
      fg: textOptions?.fg ?? tokens.colors.mutedForeground,
      ...textOptions,
    });
    this.add(this.textNode);

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (textOptions?.fg === undefined) {
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

/** Consumer-owned imperative Breadcrumb container. */
export function createBreadcrumb(
  ctx: RenderContext,
  options: BoxOptions = {},
): BreadcrumbRecipeRenderable {
  return new BreadcrumbRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Breadcrumb List layout. */
export function createBreadcrumbList(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    ...options,
  });
}

/** Consumer-owned imperative Breadcrumb Item container. */
export function createBreadcrumbItem(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    ...options,
  });
}

/** Consumer-owned imperative Breadcrumb Link item. */
export function createBreadcrumbLink(
  ctx: RenderContext,
  options: BreadcrumbLinkOptions = {},
): BreadcrumbLinkRecipeRenderable {
  return new BreadcrumbLinkRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Breadcrumb Page active item. */
export function createBreadcrumbPage(
  ctx: RenderContext,
  options: BreadcrumbPageOptions = {},
): BreadcrumbPageRecipeRenderable {
  return new BreadcrumbPageRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Breadcrumb Separator glyph. */
export function createBreadcrumbSeparator(
  ctx: RenderContext,
  options: BreadcrumbSeparatorOptions = {},
): BreadcrumbSeparatorRecipeRenderable {
  return new BreadcrumbSeparatorRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Breadcrumb Ellipsis indicator. */
export function createBreadcrumbEllipsis(
  ctx: RenderContext,
  options: BreadcrumbEllipsisOptions = {},
): BreadcrumbEllipsisRecipeRenderable {
  return new BreadcrumbEllipsisRecipeRenderable(ctx, options);
}
