import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface PaginationOptions extends BoxOptions {}

export interface PaginationContentOptions extends BoxOptions {}

export interface PaginationItemOptions extends BoxOptions {}

export interface PaginationLinkOptions extends BoxOptions {
  isActive?: boolean;
  label?: string;
}

export interface PaginationPreviousOptions extends BoxOptions {
  label?: string;
}

export interface PaginationNextOptions extends BoxOptions {
  label?: string;
}

export interface PaginationEllipsisOptions extends BoxOptions {
  label?: string;
}

class PaginationLinkRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: PaginationLinkOptions = {}) {
    const { isActive = false, label = "", ...boxOptions } = options;
    const initialTokens = theme.get();

    super(ctx, {
      paddingX: initialTokens.density.paddingX,
      borderStyle: isActive ? initialTokens.borders.style : undefined,
      ...boxOptions,
    });

    const text = new TextRenderable(ctx, { content: label });
    this.add(text);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (isActive) {
        if (boxOptions.backgroundColor === undefined) {
          this.backgroundColor = tokens.colors.primary;
        }
        if (boxOptions.borderColor === undefined) {
          this.borderColor = tokens.colors.primary;
        }
        text.fg = tokens.colors.primaryForeground;
      } else {
        if (boxOptions.backgroundColor === undefined) {
          this.backgroundColor = tokens.colors.surface;
        }
        text.fg = tokens.colors.foreground;
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

class PaginationEllipsisRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: PaginationEllipsisOptions = {}) {
    const { label = "...", ...boxOptions } = options;
    const initialTokens = theme.get();

    super(ctx, {
      paddingX: initialTokens.density.paddingX,
      ...boxOptions,
    });

    const text = new TextRenderable(ctx, { content: label });
    this.add(text);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      text.fg = tokens.colors.mutedForeground;
    };
    applyStyle(initialTokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createPagination(
  ctx: RenderContext,
  options: PaginationOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    ...options,
  });
}

export function createPaginationContent(
  ctx: RenderContext,
  options: PaginationContentOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    ...options,
  });
}

export function createPaginationItem(
  ctx: RenderContext,
  options: PaginationItemOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, options);
}

export function createPaginationLink(
  ctx: RenderContext,
  options: PaginationLinkOptions = {},
): BoxRenderable {
  return new PaginationLinkRenderable(ctx, options);
}

export function createPaginationPrevious(
  ctx: RenderContext,
  options: PaginationPreviousOptions = {},
): BoxRenderable {
  const { label = "‹ Previous", ...boxOptions } = options;
  return new PaginationLinkRenderable(ctx, {
    label,
    ...boxOptions,
  });
}

export function createPaginationNext(
  ctx: RenderContext,
  options: PaginationNextOptions = {},
): BoxRenderable {
  const { label = "Next ›", ...boxOptions } = options;
  return new PaginationLinkRenderable(ctx, {
    label,
    ...boxOptions,
  });
}

export function createPaginationEllipsis(
  ctx: RenderContext,
  options: PaginationEllipsisOptions = {},
): BoxRenderable {
  return new PaginationEllipsisRenderable(ctx, options);
}
