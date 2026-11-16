import type { BoxOptions, RenderContext } from "@opentui/core";
import { BoxRenderable } from "@opentui/core";

export interface AspectRatioOptions extends BoxOptions {
  ratio?: number;
}

/** Consumer-owned imperative AspectRatio container constraining child dimensions. */
export class AspectRatioRecipeRenderable extends BoxRenderable {
  readonly ratio: number;

  constructor(ctx: RenderContext, options: AspectRatioOptions = {}) {
    const { ratio = 16 / 9, ...boxOptions } = options;
    const computedOptions: BoxOptions = { ...boxOptions };

    if (
      typeof boxOptions.width === "number" &&
      boxOptions.height === undefined
    ) {
      computedOptions.height = Math.max(
        1,
        Math.round(boxOptions.width / ratio),
      );
    } else if (
      typeof boxOptions.height === "number" &&
      boxOptions.width === undefined
    ) {
      computedOptions.width = Math.max(
        1,
        Math.round(boxOptions.height * ratio),
      );
    }

    super(ctx, computedOptions);
    this.ratio = ratio;
  }
}

/** Consumer-owned imperative AspectRatio factory. */
export function createAspectRatio(
  ctx: RenderContext,
  options: AspectRatioOptions = {},
): AspectRatioRecipeRenderable {
  return new AspectRatioRecipeRenderable(ctx, options);
}
