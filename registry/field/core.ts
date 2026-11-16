import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export type FieldOrientation = "horizontal" | "vertical";

export interface FieldOptions extends BoxOptions {
  orientation?: FieldOrientation;
}

export interface FieldLabelOptions extends Omit<TextOptions, "content"> {
  content?: string;
  required?: boolean;
}

export interface FieldDescriptionOptions extends Omit<TextOptions, "content"> {
  content?: string;
}

export interface FieldErrorOptions extends Omit<TextOptions, "content"> {
  content?: string;
  errors?: Array<{ message?: string } | string | undefined>;
}

export interface FieldLegendOptions extends Omit<TextOptions, "content"> {
  content?: string;
}

export interface FieldSeparatorOptions extends BoxOptions {
  label?: string;
}

class FieldRenderable extends BoxRenderable {
  constructor(ctx: RenderContext, options: FieldOptions = {}) {
    const { orientation = "vertical", ...boxOptions } = options;
    super(ctx, {
      flexDirection: orientation === "horizontal" ? "row" : "column",
      gap: orientation === "horizontal" ? 1 : 0,
      ...boxOptions,
    });
  }
}

class FieldLabelRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: FieldLabelOptions = {}) {
    const { content = "", required = false, ...textOptions } = options;
    const initialTokens = theme.get();
    const displayContent = required ? `${content} *` : content;
    super(ctx, {
      content: displayContent,
      ...textOptions,
    });

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (textOptions.fg === undefined) {
        this.fg = tokens.colors.foreground;
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

class FieldDescriptionRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: FieldDescriptionOptions = {}) {
    const { content = "", ...textOptions } = options;
    const initialTokens = theme.get();
    super(ctx, {
      content,
      ...textOptions,
    });

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (textOptions.fg === undefined) {
        this.fg = tokens.colors.mutedForeground;
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

class FieldErrorRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: FieldErrorOptions = {}) {
    const { content, errors, ...textOptions } = options;
    const initialTokens = theme.get();

    let resolvedContent = content ?? "";
    if (!resolvedContent && errors && errors.length > 0) {
      const messages = errors
        .map((e) => (typeof e === "string" ? e : e?.message))
        .filter((msg): msg is string => Boolean(msg));
      resolvedContent = messages.join("; ");
    }

    super(ctx, {
      content: resolvedContent,
      ...textOptions,
    });

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (textOptions.fg === undefined) {
        this.fg = tokens.colors.destructive;
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

class FieldLegendRenderable extends TextRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: FieldLegendOptions = {}) {
    const { content = "", ...textOptions } = options;
    const initialTokens = theme.get();
    super(ctx, {
      content,
      ...textOptions,
    });

    const applyStyle = (tokens: Readonly<Tokens>) => {
      if (textOptions.fg === undefined) {
        this.fg = tokens.colors.foreground;
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

class FieldSeparatorRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: FieldSeparatorOptions = {}) {
    const { label, ...boxOptions } = options;
    const initialTokens = theme.get();
    super(ctx, {
      height: 1,
      flexDirection: "row",
      alignItems: "center",
      ...boxOptions,
    });

    const text = new TextRenderable(ctx, {
      content: label ? `── ${label} ──` : "──────",
    });
    this.add(text);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      text.fg = tokens.colors.border;
    };
    applyStyle(initialTokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

export function createFieldSet(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    gap: 1,
    ...options,
  });
}

export function createFieldGroup(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    gap: 1,
    ...options,
  });
}

export function createField(
  ctx: RenderContext,
  options: FieldOptions = {},
): BoxRenderable {
  return new FieldRenderable(ctx, options);
}

export function createFieldContent(
  ctx: RenderContext,
  options: BoxOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    flexDirection: "column",
    flexGrow: 1,
    ...options,
  });
}

export function createFieldLabel(
  ctx: RenderContext,
  options: FieldLabelOptions = {},
): TextRenderable {
  return new FieldLabelRenderable(ctx, options);
}

export function createFieldDescription(
  ctx: RenderContext,
  options: FieldDescriptionOptions = {},
): TextRenderable {
  return new FieldDescriptionRenderable(ctx, options);
}

export function createFieldError(
  ctx: RenderContext,
  options: FieldErrorOptions = {},
): TextRenderable {
  return new FieldErrorRenderable(ctx, options);
}

export function createFieldLegend(
  ctx: RenderContext,
  options: FieldLegendOptions = {},
): TextRenderable {
  return new FieldLegendRenderable(ctx, options);
}

export function createFieldSeparator(
  ctx: RenderContext,
  options: FieldSeparatorOptions = {},
): BoxRenderable {
  return new FieldSeparatorRenderable(ctx, options);
}
