import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export type SeparatorOrientation = "horizontal" | "vertical";

/** Options for creating an imperative Separator. */
export interface SeparatorOptions extends BoxOptions {
  /**
   * Whether the element is purely decorative.
   * Preserved for accessibility/semantics parity with shadcn.
   * @default true
   */
  decorative?: boolean;
  /**
   * The orientation of the separator.
   * @default "horizontal"
   */
  orientation?: SeparatorOrientation;
}

class SeparatorRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: SeparatorOptions = {}) {
    const {
      borderColor,
      borderStyle,
      decorative = true,
      height,
      orientation = "horizontal",
      width,
      ...rootOptions
    } = options;
    const tokens = theme.get();
    const isHorizontal = orientation === "horizontal";

    super(ctx, {
      border: [isHorizontal ? "top" : "left"],
      borderColor: borderColor ?? tokens.colors.border,
      borderStyle: borderStyle ?? tokens.borders.style,
      height: height ?? (isHorizontal ? 1 : undefined),
      width: width ?? (isHorizontal ? undefined : 1),
      ...rootOptions,
    });

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (borderColor === undefined) {
        this.borderColor = currentTokens.colors.border;
      }
      if (borderStyle === undefined) {
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

/** Consumer-owned imperative Separator recipe composed directly from OpenTUI Box. */
export function createSeparator(
  ctx: RenderContext,
  options: SeparatorOptions = {},
): BoxRenderable {
  return new SeparatorRecipeRenderable(ctx, options);
}
