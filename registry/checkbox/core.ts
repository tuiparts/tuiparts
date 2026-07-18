import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
} from "@tuiparts/core/checkbox";
import { type Tokens, theme } from "./theme";

export interface CheckboxOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  onCheckedChange?: (checked: boolean) => void;
}

class CheckboxRecipeRenderable extends CheckboxRootRenderable {
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: CheckboxOptions) {
    const tokens = theme.get();
    super(ctx, {
      backgroundColor: "transparent",
      checked: options.checked,
      defaultChecked: options.defaultChecked,
      disabled: options.disabled,
      flexDirection: "row",
      gap: 1,
      onCheckedChange: options.onCheckedChange,
    });
    const markCell = new BoxRenderable(ctx, { width: 1 });
    const indicator = new CheckboxIndicatorRenderable(ctx, {
      store: this.store,
    });
    const mark = new TextRenderable(ctx, {
      content: options.mark ?? tokens.glyphs.check,
      fg: tokens.colors.primary,
    });
    indicator.add(mark);
    markCell.add(indicator);
    this.add(markCell);
    const label = new TextRenderable(ctx, {
      content: options.label,
      fg: options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground,
    });
    this.add(label);

    const applyStyle = (tokens: Readonly<Tokens>) => {
      mark.content = options.mark ?? tokens.glyphs.check;
      mark.fg = tokens.colors.primary;
      label.fg = options.disabled
        ? tokens.colors.disabledForeground
        : tokens.colors.foreground;
    };
    applyStyle(tokens);
    this.unsubscribeTheme = theme.subscribe(() => applyStyle(theme.get()));
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Consumer-owned imperative recipe using packaged Checkbox behavior. */
export function createCheckbox(
  ctx: RenderContext,
  options: CheckboxOptions,
): CheckboxRootRenderable {
  return new CheckboxRecipeRenderable(ctx, options);
}
