import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type CollapsiblePanelOptions,
  CollapsiblePanelRenderable,
  CollapsibleRootRenderable,
  type CollapsibleTriggerOptions,
  CollapsibleTriggerRenderable,
  type CollapsibleTriggerState,
  type CollapsibleRootOptions as PrimitiveCollapsibleRootOptions,
} from "@tuiparts/core/collapsible";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative Collapsible Root. */
export type CollapsibleOptions = Omit<PrimitiveCollapsibleRootOptions, "store">;

/** Options for one labeled imperative Collapsible Trigger. */
export interface CollapsibleTriggerRecipeOptions
  extends Omit<CollapsibleTriggerOptions, "store"> {
  /** Marker shown while closed. */
  closedMark?: string;
  /** Trigger label. */
  label: string;
  /** Marker shown while open. */
  openMark?: string;
}

/** Options for one imperative Collapsible content region. */
export type CollapsibleContentOptions = Omit<CollapsiblePanelOptions, "store">;

class RecipeTriggerRenderable extends CollapsibleTriggerRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    options: CollapsibleTriggerRecipeOptions & {
      store: CollapsibleRootRenderable["store"];
    },
  ) {
    const {
      closedMark = "›",
      label: content,
      openMark = "⌄",
      ...trigger
    } = options;
    super(ctx, {
      flexDirection: "row",
      gap: 1,
      ...trigger,
    });
    const mark = new TextRenderable(ctx, { content: closedMark });
    const label = new TextRenderable(ctx, { content });
    this.add(mark);
    this.add(label);

    const apply = (
      tokens: Readonly<Tokens>,
      state: CollapsibleTriggerState,
    ) => {
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

class RecipePanelRenderable extends CollapsiblePanelRenderable {
  private readonly consumerPaddingLeft: CollapsibleContentOptions["paddingLeft"];
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    options: CollapsibleContentOptions & {
      store: CollapsibleRootRenderable["store"];
    },
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

/** Creates the imperative Collapsible ownership boundary. */
export function createCollapsible(
  ctx: RenderContext,
  options: CollapsibleOptions = {},
): CollapsibleRootRenderable {
  return new CollapsibleRootRenderable(ctx, {
    flexDirection: "column",
    gap: 1,
    ...options,
  });
}

/** Creates one labeled imperative Collapsible Trigger. */
export function createCollapsibleTrigger(
  ctx: RenderContext,
  root: CollapsibleRootRenderable,
  options: CollapsibleTriggerRecipeOptions,
): CollapsibleTriggerRenderable {
  return new RecipeTriggerRenderable(ctx, { ...options, store: root.store });
}

/** Creates one imperative Collapsible content region. */
export function createCollapsibleContent(
  ctx: RenderContext,
  root: CollapsibleRootRenderable,
  options: CollapsibleContentOptions = {},
): CollapsiblePanelRenderable {
  return new RecipePanelRenderable(ctx, { ...options, store: root.store });
}
