import type { BoxOptions, RenderContext, TextOptions } from "@opentui/core";
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface InputGroupRootOptions extends BoxOptions {}

export interface InputGroupAddonOption extends BoxOptions {}

export interface InputGroupTextOptions extends BoxOptions {
  content?: string;
  textOptions?: TextOptions;
}

/** Root container renderable for input groups. */
export class InputGroupRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: InputGroupRootOptions = {}) {
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      border: options.border ?? true,
      borderColor: options.borderColor ?? tokens.colors.border,
      borderStyle: options.borderStyle ?? tokens.borders.style,
      flexDirection: "row",
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

/** Addon slot for prefix or suffix elements in an input group. */
export class InputGroupAddonRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: InputGroupAddonOption = {}) {
    const tokens = theme.get();
    super(ctx, {
      alignItems: "center",
      backgroundColor: options.backgroundColor ?? tokens.colors.surface,
      flexDirection: "row",
      paddingX: options.paddingX ?? 1,
      ...options,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (options.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Text label addon for input groups. */
export class InputGroupTextRecipeRenderable extends BoxRenderable {
  readonly textNode?: TextRenderable;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: InputGroupTextOptions = {}) {
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

/** Consumer-owned imperative InputGroup container. */
export function createInputGroup(
  ctx: RenderContext,
  options: InputGroupRootOptions = {},
): InputGroupRecipeRenderable {
  return new InputGroupRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative InputGroup Addon container. */
export function createInputGroupAddon(
  ctx: RenderContext,
  options: InputGroupAddonOption = {},
): InputGroupAddonRecipeRenderable {
  return new InputGroupAddonRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative InputGroup Text element. */
export function createInputGroupText(
  ctx: RenderContext,
  options: InputGroupTextOptions = {},
): InputGroupTextRecipeRenderable {
  return new InputGroupTextRecipeRenderable(ctx, options);
}
