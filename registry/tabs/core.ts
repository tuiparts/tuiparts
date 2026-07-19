import { type RenderContext, TextRenderable } from "@opentui/core";
import {
  type TabsRootOptions as PrimitiveTabsRootOptions,
  type TabsListOptions,
  TabsListRenderable,
  type TabsPanelOptions,
  TabsPanelRenderable,
  TabsRootRenderable,
  type TabsTabOptions,
  TabsTabRenderable,
  type TabsTabState,
} from "@tuiparts/core/tabs";
import { type Tokens, theme } from "./theme";

/** Options for the consumer-owned imperative Tabs Root. */
export type TabsOptions = Omit<PrimitiveTabsRootOptions, "store">;

/** Options for one labeled imperative Tab Recipe Part. */
export interface TabsTabRecipeOptions extends Omit<TabsTabOptions, "store"> {
  label: string;
}

class RecipeTabRenderable extends TabsTabRenderable {
  private readonly unsubscribeState: () => void;
  private readonly unsubscribeTheme: () => void;

  constructor(
    ctx: RenderContext,
    options: TabsTabRecipeOptions & { store: TabsRootRenderable["store"] },
  ) {
    const { label: content, ...tabOptions } = options;
    const tokens = theme.get();
    super(ctx, {
      ...tabOptions,
      paddingX: tabOptions.paddingX ?? tokens.density.paddingX,
    });
    const label = new TextRenderable(ctx, { content });
    this.add(label);
    const apply = (nextTokens: Readonly<Tokens>, state: TabsTabState) => {
      this.backgroundColor = state.selected
        ? nextTokens.colors.primary
        : state.focused
          ? nextTokens.colors.surface
          : "transparent";
      label.fg = state.disabled
        ? nextTokens.colors.disabledForeground
        : state.selected
          ? nextTokens.colors.primaryForeground
          : nextTokens.colors.foreground;
    };
    apply(tokens, this.getState());
    this.unsubscribeState = this.subscribe((state) =>
      apply(theme.get(), state),
    );
    this.unsubscribeTheme = theme.subscribe(() =>
      apply(theme.get(), this.getState()),
    );
  }

  override destroy(): void {
    this.unsubscribeState();
    this.unsubscribeTheme();
    super.destroy();
  }
}

/** Creates the imperative Tabs ownership boundary. */
export function createTabs(
  ctx: RenderContext,
  options: TabsOptions = {},
): TabsRootRenderable {
  return new TabsRootRenderable(ctx, { ...options, gap: options.gap ?? 1 });
}

/** Creates the imperative Tabs List layout. */
export function createTabsList(
  ctx: RenderContext,
  root: TabsRootRenderable,
  options: Omit<TabsListOptions, "store"> = {},
): TabsListRenderable {
  return new TabsListRenderable(ctx, {
    ...options,
    flexDirection: root.orientation === "vertical" ? "column" : "row",
    gap: options.gap ?? 1,
    store: root.store,
  });
}

/** Creates one labeled imperative Tab. */
export function createTabsTab(
  ctx: RenderContext,
  root: TabsRootRenderable,
  options: TabsTabRecipeOptions,
): TabsTabRenderable {
  return new RecipeTabRenderable(ctx, { ...options, store: root.store });
}

/** Creates one imperative Tabs Panel without choosing its content. */
export function createTabsPanel(
  ctx: RenderContext,
  root: TabsRootRenderable,
  options: Omit<TabsPanelOptions, "store">,
): TabsPanelRenderable {
  return new TabsPanelRenderable(ctx, { ...options, store: root.store });
}
