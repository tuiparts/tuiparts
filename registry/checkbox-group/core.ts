import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
  type CheckboxState,
} from "@tuiparts/core/checkbox";
import {
  CheckboxGroupRenderable,
  type CheckboxGroupStore,
  type CheckboxGroupOptions as PrimitiveCheckboxGroupOptions,
} from "@tuiparts/core/checkbox-group";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative CheckboxGroup Root. */
export type CheckboxGroupOptions = Omit<PrimitiveCheckboxGroupOptions, "store">;

/** Options for one consumer-owned grouped Checkbox. */
export interface CheckboxGroupItemOptions {
  /** Whether this Checkbox is locally disabled. */
  disabled?: boolean;
  /** Grouped Checkbox label. */
  label: string;
  /** One terminal-cell mark; widen the editable mark cell for wider content. */
  mark?: string;
  /** Unique value owned by CheckboxGroup. */
  value: string;
}

class CheckboxGroupItemRecipeRenderable extends CheckboxRootRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    store: CheckboxGroupStore,
    options: CheckboxGroupItemOptions,
  ) {
    super(ctx, {
      backgroundColor: "transparent",
      disabled: options.disabled,
      flexDirection: "row",
      gap: 1,
      group: store,
      value: options.value,
    });
    const markCell = new BoxRenderable(ctx, { width: 1 });
    const indicator = new CheckboxIndicatorRenderable(ctx, {
      store: this.store,
    });
    const mark = new TextRenderable(ctx, { content: "" });
    const label = new TextRenderable(ctx, { content: options.label });
    indicator.add(mark);
    markCell.add(indicator);
    this.add(markCell);
    this.add(label);

    const apply = (tokens: Readonly<Tokens>, state: CheckboxState) => {
      mark.content = options.mark ?? tokens.glyphs.check;
      mark.fg = tokens.colors.primary;
      label.fg = state.disabled
        ? tokens.colors.disabledForeground
        : state.focused
          ? tokens.colors.focus
          : tokens.colors.foreground;
    };
    apply(theme.get(), this.getState());
    this.unsubscribeState = this.subscribe((state) =>
      apply(theme.get(), state),
    );
    this.unsubscribeTheme = theme.subscribe(() =>
      apply(theme.get(), this.getState()),
    );
  }

  override endCoordinationLifetime(): void {
    this.unsubscribeState();
    this.unsubscribeTheme();
    super.endCoordinationLifetime();
  }
}

/** Creates the imperative CheckboxGroup ownership boundary. */
export function createCheckboxGroup(
  ctx: RenderContext,
  options: CheckboxGroupOptions = {},
): CheckboxGroupRenderable {
  return new CheckboxGroupRenderable(ctx, {
    ...options,
    flexDirection: options.orientation === "horizontal" ? "row" : "column",
    gap: options.gap ?? 1,
  });
}

/** Creates one grouped Checkbox using packaged Checkbox behavior. */
export function createCheckboxGroupItem(
  ctx: RenderContext,
  store: CheckboxGroupStore,
  options: CheckboxGroupItemOptions,
): CheckboxRootRenderable {
  return new CheckboxGroupItemRecipeRenderable(ctx, store, options);
}
