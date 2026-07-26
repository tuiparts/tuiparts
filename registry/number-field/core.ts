import {
  BoxRenderable,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  type NumberFieldRootOptions,
  NumberFieldRootRenderable,
  NumberFieldScrubAreaRenderable,
} from "@tuiparts/core/number-field";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative NumberField Recipe. */
export interface NumberFieldOptions
  extends Omit<NumberFieldRootOptions, "store"> {
  /** Label shown in the draggable ScrubArea. */
  label: string;
  /** Decrement glyph. */
  decrementMark?: string;
  /** Increment glyph. */
  incrementMark?: string;
}

class NumberFieldRecipeRenderable extends NumberFieldRootRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(ctx: RenderContext, options: NumberFieldOptions) {
    const {
      decrementMark = "−",
      incrementMark = "+",
      label,
      ...rootOptions
    } = options;
    super(ctx, { ...rootOptions, flexDirection: "column", gap: 1 });
    const scrub = new NumberFieldScrubAreaRenderable(ctx, {
      store: this.store,
    });
    const labelText = new TextRenderable(ctx, { content: label });
    scrub.add(labelText);
    const group = new BoxRenderable(ctx, { flexDirection: "row" });
    const decrement = new NumberFieldDecrementRenderable(ctx, {
      justifyContent: "center",
      store: this.store,
      width: 3,
    });
    const decrementText = new TextRenderable(ctx, { content: decrementMark });
    decrement.add(decrementText);
    const input = new NumberFieldInputRenderable(ctx, {
      store: this.store,
      width: 8,
    });
    const increment = new NumberFieldIncrementRenderable(ctx, {
      justifyContent: "center",
      store: this.store,
      width: 3,
    });
    const incrementText = new TextRenderable(ctx, { content: incrementMark });
    increment.add(incrementText);
    group.add(decrement);
    group.add(input);
    group.add(increment);
    this.add(scrub);
    this.add(group);
    const apply = (tokens: Readonly<Tokens>) => {
      const color = tokens.colors.foreground;
      labelText.fg = this.getState().scrubbing ? tokens.colors.focus : color;
      decrementText.fg = color;
      incrementText.fg = color;
      input.textColor = color;
    };
    apply(theme.get());
    this.unsubscribeState = this.store.subscribe(() => apply(theme.get()));
    this.unsubscribeTheme = theme.subscribe(() => apply(theme.get()));
  }

  override endCoordinationLifetime(): void {
    this.unsubscribeState();
    this.unsubscribeTheme();
    super.endCoordinationLifetime();
  }
}

/** Creates a complete imperative NumberField Recipe. */
export function createNumberField(
  ctx: RenderContext,
  options: NumberFieldOptions,
): NumberFieldRootRenderable {
  return new NumberFieldRecipeRenderable(ctx, options);
}
