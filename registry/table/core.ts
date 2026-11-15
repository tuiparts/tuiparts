import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  TextAttributes,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

/** Options for creating an imperative Table container. */
export type TableOptions = BoxOptions;

/** Options for creating an imperative Table Header section. */
export type TableHeaderOptions = BoxOptions;

/** Options for creating an imperative Table Body section. */
export type TableBodyOptions = BoxOptions;

/** Options for creating an imperative Table Footer section. */
export type TableFooterOptions = BoxOptions;

/** Options for creating an imperative Table Row layout. */
export interface TableRowOptions extends BoxOptions {
  /** Whether to draw a bottom border dividing this row. Defaults to true. */
  borderBottom?: boolean;
}

/** Options for creating an imperative Table Head column header. */
export interface TableHeadOptions extends BoxOptions {
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Options for creating an imperative Table Cell data container. */
export interface TableCellOptions extends BoxOptions {
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

/** Options for creating an imperative Table Caption. */
export interface TableCaptionOptions extends BoxOptions {
  content?: string;
  textOptions?: Omit<TextOptions, "content">;
}

export class TableRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TableOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      border: options.border ?? true,
      borderColor: options.borderColor ?? tokens.colors.border,
      borderStyle: options.borderStyle ?? tokens.borders.style,
      flexDirection: options.flexDirection ?? "column",
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

export class TableHeadRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TableHeadOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      paddingX: boxOptions.paddingX ?? 1,
      ...boxOptions,
    });

    if (content !== undefined) {
      this.textNode = new TextRenderable(ctx, {
        attributes: textOptions?.attributes ?? TextAttributes.BOLD,
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

export class TableCellRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TableCellOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      flexDirection: "row",
      paddingX: boxOptions.paddingX ?? 1,
      ...boxOptions,
    });

    if (content !== undefined) {
      this.textNode = new TextRenderable(ctx, {
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

export class TableCaptionRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: TableCaptionOptions = {}) {
    const { content, textOptions, ...boxOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      paddingTop: boxOptions.paddingTop ?? 1,
      paddingX: boxOptions.paddingX ?? 1,
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

/** Consumer-owned imperative Table container. */
export function createTable(
  ctx: RenderContext,
  options: TableOptions = {},
): TableRecipeRenderable {
  return new TableRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Table Header layout. */
export function createTableHeader(
  ctx: RenderContext,
  options: TableHeaderOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    ...options,
  });
}

/** Consumer-owned imperative Table Body container. */
export function createTableBody(
  ctx: RenderContext,
  options: TableBodyOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    ...options,
  });
}

/** Consumer-owned imperative Table Footer layout. */
export function createTableFooter(
  ctx: RenderContext,
  options: TableFooterOptions = {},
): BoxRenderable {
  const tokens = theme.get();
  return new BoxRenderable(ctx, {
    border: options.border ?? ["top"],
    borderColor: options.borderColor ?? tokens.colors.border,
    borderStyle: options.borderStyle ?? "single",
    flexDirection: "column",
    ...options,
  });
}

/** Consumer-owned imperative Table Row layout. */
export function createTableRow(
  ctx: RenderContext,
  options: TableRowOptions = {},
): BoxRenderable {
  const tokens = theme.get();
  const { borderBottom = true, ...boxOptions } = options;
  return new BoxRenderable(ctx, {
    alignItems: "center",
    border: boxOptions.border ?? (borderBottom ? ["bottom"] : false),
    borderColor: boxOptions.borderColor ?? tokens.colors.border,
    borderStyle: boxOptions.borderStyle ?? "single",
    flexDirection: "row",
    ...boxOptions,
  });
}

/** Consumer-owned imperative Table Head column header. */
export function createTableHead(
  ctx: RenderContext,
  options: TableHeadOptions = {},
): TableHeadRecipeRenderable {
  return new TableHeadRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Table Cell data container. */
export function createTableCell(
  ctx: RenderContext,
  options: TableCellOptions = {},
): TableCellRecipeRenderable {
  return new TableCellRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative Table Caption presentation. */
export function createTableCaption(
  ctx: RenderContext,
  options: TableCaptionOptions = {},
): TableCaptionRecipeRenderable {
  return new TableCaptionRecipeRenderable(ctx, options);
}
