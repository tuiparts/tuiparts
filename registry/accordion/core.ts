import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type AccordionItemOptions,
  AccordionItemRenderable,
  type AccordionPanelOptions,
  AccordionPanelRenderable,
  AccordionRootRenderable,
  type AccordionTriggerOptions,
  AccordionTriggerRenderable,
  type AccordionTriggerState,
  type AccordionRootOptions as PrimitiveAccordionRootOptions,
} from "@tuiparts/core/accordion";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative Accordion Root. */
export type AccordionOptions = Omit<PrimitiveAccordionRootOptions, "store">;

/** Options for one consumer-owned imperative Accordion Item. */
export type AccordionItemRecipeOptions = Omit<AccordionItemOptions, "store">;

/** Options for one labeled imperative Accordion Trigger. */
export interface AccordionTriggerRecipeOptions
  extends Omit<AccordionTriggerOptions, "item"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Options for one imperative Accordion content region. */
export type AccordionContentOptions = Omit<AccordionPanelOptions, "item">;

class RecipeTriggerRenderable extends AccordionTriggerRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    options: AccordionTriggerRecipeOptions & {
      item: AccordionItemRenderable;
    },
  ) {
    const {
      closedMark = "›",
      label: content,
      openMark = "⌄",
      ...trigger
    } = options;
    super(ctx, { flexDirection: "row", gap: 1, ...trigger });
    const mark = new TextRenderable(ctx, { content: closedMark });
    const label = new TextRenderable(ctx, { content });
    this.add(mark);
    this.add(label);

    const apply = (tokens: Readonly<Tokens>, state: AccordionTriggerState) => {
      mark.content = state.open ? openMark : closedMark;
      mark.fg = state.focused ? tokens.colors.focus : tokens.colors.primary;
      label.fg = state.disabled
        ? tokens.colors.disabledForeground
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

class RecipePanelRenderable extends AccordionPanelRenderable {
  private readonly consumerPaddingLeft: AccordionContentOptions["paddingLeft"];
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    options: AccordionContentOptions & { item: AccordionItemRenderable },
  ) {
    const tokens = theme.get();
    super(ctx, {
      paddingLeft: options.paddingLeft ?? tokens.density.comfortablePaddingX,
      ...options,
    });
    this.consumerPaddingLeft = options.paddingLeft;
    this.unsubscribeTheme = theme.subscribe(() => {
      if (this.consumerPaddingLeft === undefined) {
        this.paddingLeft = theme.get().density.comfortablePaddingX;
      }
    });
  }

  override endCoordinationLifetime(): void {
    this.unsubscribeTheme();
    super.endCoordinationLifetime();
  }
}

/** Creates the imperative Accordion ownership boundary. */
export function createAccordion(
  ctx: RenderContext,
  options: AccordionOptions = {},
): AccordionRootRenderable {
  return new AccordionRootRenderable(ctx, {
    flexDirection: "column",
    ...options,
  });
}

/** Creates one imperative Accordion Item. */
export function createAccordionItem(
  ctx: RenderContext,
  root: AccordionRootRenderable,
  options: AccordionItemRecipeOptions,
): AccordionItemRenderable {
  return new AccordionItemRenderable(ctx, {
    flexDirection: "column",
    gap: 1,
    ...options,
    store: root.store,
  });
}

/** Creates one labeled imperative Accordion Trigger. */
export function createAccordionTrigger(
  ctx: RenderContext,
  item: AccordionItemRenderable,
  options: AccordionTriggerRecipeOptions,
): AccordionTriggerRenderable {
  return new RecipeTriggerRenderable(ctx, { ...options, item });
}

/** Creates one imperative Accordion content region. */
export function createAccordionContent(
  ctx: RenderContext,
  item: AccordionItemRenderable,
  options: AccordionContentOptions = {},
): AccordionPanelRenderable {
  return new RecipePanelRenderable(ctx, { ...options, item });
}
