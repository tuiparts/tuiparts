import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
  type TextOptions,
  TextRenderable,
} from "@opentui/core";
import { type Tokens, theme } from "./theme";

export interface KbdOptions extends BoxOptions {
  keys?: string[];
  label?: string;
  labelOptions?: Omit<TextOptions, "content">;
}

export type KbdGroupOptions = BoxOptions;

function resolveLabel(options: { label?: string; keys?: string[] }): string {
  if (options.label !== undefined) return options.label;
  if (options.keys !== undefined && options.keys.length > 0)
    return options.keys.join("+");
  return "";
}

class KbdRecipeRenderable extends BoxRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: KbdOptions = {}) {
    const { keys, label, labelOptions, ...rootOptions } = options;
    const tokens = theme.get();
    const textContent = resolveLabel({ label, keys });

    super(ctx, {
      backgroundColor: rootOptions.backgroundColor ?? tokens.colors.surface,
      paddingX: rootOptions.paddingX ?? tokens.density.paddingX,
      ...rootOptions,
    });

    const text = new TextRenderable(ctx, {
      content: textContent,
      fg: labelOptions?.fg ?? tokens.colors.mutedForeground,
      ...labelOptions,
    });
    this.add(text);

    const applyStyle = (currentTokens: Readonly<Tokens>) => {
      if (rootOptions.backgroundColor === undefined) {
        this.backgroundColor = currentTokens.colors.surface;
      }
      if (labelOptions?.fg === undefined) {
        text.fg = currentTokens.colors.mutedForeground;
      }
    };

    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative Kbd recipe composed directly from OpenTUI Renderables. */
export function createKbd(
  ctx: RenderContext,
  options: KbdOptions = {},
): BoxRenderable {
  return new KbdRecipeRenderable(ctx, options);
}

/** Consumer-owned imperative KbdGroup layout for grouping key shortcuts. */
export function createKbdGroup(
  ctx: RenderContext,
  options: KbdGroupOptions = {},
): BoxRenderable {
  return new BoxRenderable(ctx, {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    ...options,
  });
}
