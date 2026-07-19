import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";
import {
  type CollectionEntry,
  type CollectionFocusDirection,
  type CollectionItemInput,
  type CollectionItemKey,
  type CollectionItemRegistration,
  type RegisteredCollectionItem,
  RovingCollectionRenderable,
  RovingCollectionStore,
} from "../internal/roving-collection";

/** Selection behavior when keyboard navigation focuses another Tab. */
export type TabsActivationMode = "automatic" | "manual";

/** Layout axis used by Tabs keyboard navigation. */
export type TabsOrientation = "horizontal" | "vertical";

/** Cause of one accepted Tabs selection request. */
export type TabsChangeDetails = PressDetails | Readonly<{ source: "focus" }>;

/** Immutable observable state for one Tabs Root. */
export interface TabsState {
  readonly activationMode: TabsActivationMode;
  readonly disabled: boolean;
  readonly orientation: TabsOrientation;
  readonly value: string | null;
}

/** Immutable observable state for one Tabs Tab. */
export interface TabsTabState {
  readonly associated: boolean;
  readonly available: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly selected: boolean;
  readonly tabbable: boolean;
  readonly value: string;
}

/** Immutable observable state for one Tabs Panel. */
export interface TabsPanelState {
  readonly active: boolean;
  readonly associated: boolean;
  readonly value: string;
}

/** Callback invoked for one accepted semantic selection request. */
export type TabsValueChangeHandler = (
  value: string,
  details: TabsChangeDetails,
) => void;

/** Options used to construct a Tabs Store. */
export interface TabsStoreOptions {
  readonly activationMode?: TabsActivationMode;
  readonly defaultValue?: string | null;
  readonly disabled?: boolean;
  readonly loopFocus?: boolean;
  readonly onValueChange?: TabsValueChangeHandler;
  readonly orientation?: TabsOrientation;
  readonly value?: string | null;
}

type TabsTabCollectionState = Omit<TabsTabState, "focused">;
type TabsItemKey = CollectionItemKey;

interface PanelRegistration {
  readonly isAvailable: () => boolean;
}

/** Framework-neutral selection, association, and roving-focus owner for Tabs. */
export class TabsStore extends RovingCollectionStore<
  TabsState,
  TabsTabCollectionState
> {
  private controlled: boolean;
  private listOwner?: object;
  private _loopFocus: boolean;
  private onValueChangeCallback?: TabsValueChangeHandler;
  private readonly panels = new Map<string, PanelRegistration>();

  /** Creates a Tabs Store. */
  constructor(options: TabsStoreOptions = {}) {
    super("Tabs", {
      activationMode: options.activationMode ?? "automatic",
      disabled: options.disabled ?? false,
      orientation: options.orientation ?? "horizontal",
      value:
        options.value !== undefined
          ? options.value
          : (options.defaultValue ?? null),
    });
    this.controlled = options.value !== undefined;
    this._loopFocus = options.loopFocus ?? true;
    this.onValueChangeCallback = options.onValueChange;
  }

  /** Whether keyboard navigation wraps at collection edges. */
  get loopFocus(): boolean {
    return this._loopFocus;
  }

  /** Registers the one List that owns rendered Tab order. */
  attachList(owner: object): void {
    if (this.listOwner && this.listOwner !== owner)
      throw new Error("Tabs.Root may contain only one live Tabs.List");
    this.listOwner = owner;
  }

  /** Verifies that another List may claim rendered-order ownership. */
  assertListAvailable(): void {
    if (this.listOwner)
      throw new Error("Tabs.Root may contain only one live Tabs.List");
  }

  /** Releases List ownership. */
  detachList(owner: object): void {
    if (this.listOwner === owner) this.listOwner = undefined;
  }

  /** Registers one Tab value and its focus/lifecycle seams. */
  registerTab(
    value: string,
    options: {
      readonly disabled?: boolean;
      readonly focus: () => void;
      readonly isAvailable: () => boolean;
    },
  ): CollectionItemRegistration {
    const registration = super.registerItem(value, options);
    this.reconcileSelection();
    return {
      ...registration,
      refreshAvailability: () => {
        registration.refreshAvailability();
        this.reconcileSelection();
      },
      setDisabled: (disabled) => {
        registration.setDisabled(disabled);
        this.reconcileSelection();
      },
      setValue: (next) => {
        registration.setValue(next);
        this.reconcileSelection();
      },
      unregister: () => {
        registration.unregister();
        this.reconcileSelection();
      },
    };
  }

  /** Registers one Panel association. */
  registerPanel(
    value: string,
    isAvailable: () => boolean,
  ): { refresh(): void; setValue(value: string): void; unregister(): void } {
    if (this.panels.has(value))
      throw new Error(`Tabs.Panel value "${value}" is already registered`);
    const panel: PanelRegistration = { isAvailable };
    this.panels.set(value, panel);
    this.refreshAssociations();
    let currentValue = value;
    return {
      refresh: () => this.refreshAssociations(),
      setValue: (next) => {
        if (next === currentValue) return;
        if (this.panels.has(next))
          throw new Error(`Tabs.Panel value "${next}" is already registered`);
        this.panels.delete(currentValue);
        currentValue = next;
        this.panels.set(next, panel);
        this.refreshAssociations();
      },
      unregister: () => {
        if (this.panels.get(currentValue) !== panel) return;
        this.panels.delete(currentValue);
        this.refreshAssociations();
      },
    };
  }

  /** Refreshes dynamic Panel availability and selection repair. */
  refreshPanels(): void {
    this.refreshAssociations();
  }

  /** Requests selection by value through the same validity rules as input. */
  select(
    value: string,
    details: TabsChangeDetails = Object.freeze({ source: "imperative" }),
  ): void {
    this.runMutation(() => {
      const entry = this.getOrderedItems().find(
        ([, item]) => item.value === value,
      );
      if (!entry) return;
      const [key, item] = entry;
      if (!this.isItemAvailable(item) || this.state.value === value) return;
      if (!this.controlled) this.update({ value });
      const immutableDetails = Object.isFrozen(details)
        ? details
        : Object.freeze({ ...details });
      this.onValueChangeCallback?.(value, immutableDetails);
      if (this.state.activationMode === "automatic") this.activeKey = key;
    });
  }

  /** Applies a controlled value, or releases control when undefined. */
  setValue(value: string | null | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this.controlled = false;
        this.reconcileSelection();
        return;
      }
      this.controlled = true;
      this.update({ value });
    });
  }

  /** Updates Root disablement. */
  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) this.activeKey = null;
      this.update({ disabled });
      this.reconcileSelection();
    });
  }

  /** Updates navigation activation behavior. */
  setActivationMode(activationMode: TabsActivationMode): void {
    this.runMutation(() => this.update({ activationMode }));
  }

  /** Updates keyboard-navigation orientation. */
  setOrientation(orientation: TabsOrientation): void {
    this.runMutation(() => this.update({ orientation }));
  }

  /** Updates whether keyboard navigation wraps. */
  setLoopFocus(loopFocus: boolean): void {
    this._loopFocus = loopFocus;
  }

  /** Replaces the value-change callback. */
  setOnValueChange(callback: TabsValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  /** Returns whether a live eligible Tab exists for a value. */
  hasAvailableTab(value: string): boolean {
    return this.getOrderedItems().some(
      ([, item]) => item.value === value && this.isItemAvailable(item),
    );
  }

  /** Returns whether a live Panel is associated with a value. */
  hasAvailablePanel(value: string): boolean {
    return this.panels.get(value)?.isAvailable() ?? false;
  }

  /** Releases callbacks and registrations owned by this Store. */
  destroy(): void {
    this.onValueChangeCallback = undefined;
    this.panels.clear();
    this.listOwner = undefined;
    this.disposeCollection();
  }

  override refreshItemOrder(): void {
    super.refreshItemOrder();
    this.reconcileSelection();
  }

  override setCollectionAvailable(available: boolean): void {
    super.setCollectionAvailable(available);
    this.reconcileSelection();
  }

  protected createItemState(
    key: TabsItemKey,
    item: CollectionItemInput,
  ): TabsTabCollectionState {
    return Object.freeze({
      associated: this.hasAvailablePanel(item.value),
      available: this.collectionAvailable && (item.isAvailable?.() ?? true),
      disabled: this.state.disabled || item.disabled,
      selected: item.value === this.state.value,
      tabbable: key === this.tabStopKey,
      value: item.value,
    });
  }

  protected override preferredTabStop(
    enabled: ReadonlyArray<CollectionEntry<TabsTabCollectionState>>,
  ): CollectionEntry<TabsTabCollectionState> | undefined {
    return enabled.find(([, item]) => item.value === this.state.value);
  }

  protected override navigationWraps(): boolean {
    return this._loopFocus;
  }

  protected override canActivate(
    item: RegisteredCollectionItem<TabsTabCollectionState>,
  ): boolean {
    return this.isItemAvailable(item);
  }

  protected override onItemValueRenamed(
    previous: string,
    next: string,
  ): boolean {
    if (this.controlled || this.state.value !== previous) return false;
    this.update({ value: next });
    return true;
  }

  protected override onItemUnregistered(): boolean {
    return false;
  }

  private refreshAssociations(): void {
    this.runMutation(() => {
      const changed = this.refreshItems();
      const previous = this.state.value;
      this.reconcileSelection();
      if (changed && previous === this.state.value) this.touch();
    });
  }

  private reconcileSelection(): void {
    if (this.controlled || this.state.disabled) return;
    const ordered = this.getOrderedItems();
    const eligible = ordered.filter(([, item]) => this.isItemAvailable(item));
    if (
      this.state.value !== null &&
      eligible.some(([, item]) => item.value === this.state.value)
    )
      return;
    const selectedIndex = ordered.findIndex(
      ([, item]) => item.value === this.state.value,
    );
    const next =
      eligible.find((entry) => ordered.indexOf(entry) > selectedIndex) ??
      [...eligible]
        .reverse()
        .find((entry) => ordered.indexOf(entry) < selectedIndex) ??
      eligible[0];
    this.update({ value: next?.[1].value ?? null });
  }
}

/** Native OpenTUI options plus Tabs Root behavior props. */
export interface TabsRootOptions extends BoxOptions, TabsStoreOptions {
  store?: TabsStore;
}

/** Non-focusable ownership boundary for one Tabs instance. */
export class TabsRootRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: TabsStore;
  private readonly ownsStore: boolean;
  private readonly unsubscribe: () => void;

  /** Creates a Tabs Root Renderable. */
  constructor(ctx: RenderContext, options: TabsRootOptions = {}) {
    const {
      activationMode,
      defaultValue,
      disabled,
      loopFocus,
      onValueChange,
      orientation,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this.ownsStore = !store;
    this._store =
      store ??
      new TabsStore({
        activationMode,
        defaultValue,
        disabled,
        loopFocus,
        onValueChange,
        orientation,
        value,
      });
    if (store) {
      if (activationMode !== undefined) store.setActivationMode(activationMode);
      if (disabled !== undefined) store.setDisabled(disabled);
      if (loopFocus !== undefined) store.setLoopFocus(loopFocus);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
      if (orientation !== undefined) store.setOrientation(orientation);
      if (value !== undefined) store.setValue(value);
    }
    this.unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  /** Store owned or adopted by this Root. */
  get store(): TabsStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Root Store. */
  set store(store: TabsStore) {
    if (store !== this._store) throw new Error("Tabs store cannot be replaced");
  }

  /** Current immutable Root state. */
  getState(): TabsState {
    return this._store.state;
  }

  /** Current selected value. */
  get value(): string | null {
    return this._store.state.value;
  }

  set value(value: string | null | undefined) {
    this._store.setValue(value);
  }

  /** Whether the whole Tabs instance is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  /** Current activation mode. */
  get activationMode(): TabsActivationMode {
    return this._store.state.activationMode;
  }

  set activationMode(mode: TabsActivationMode | null | undefined) {
    this._store.setActivationMode(mode ?? "automatic");
  }

  /** Current navigation orientation. */
  get orientation(): TabsOrientation {
    return this._store.state.orientation;
  }

  set orientation(orientation: TabsOrientation | null | undefined) {
    this._store.setOrientation(orientation ?? "horizontal");
  }

  /** Whether focus navigation wraps. */
  get loopFocus(): boolean {
    return this._store.loopFocus;
  }

  set loopFocus(loopFocus: boolean | null | undefined) {
    this._store.setLoopFocus(loopFocus ?? true);
  }

  /** Replaces the selection callback. */
  set onValueChange(callback: TabsValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  protected override onUpdate(deltaTime: number): void {
    this._store.refreshPanels();
    super.onUpdate(deltaTime);
  }

  /** Releases Root subscriptions and an internally owned Store. */
  override destroy(): void {
    this.unsubscribe();
    if (this.ownsStore) this._store.destroy();
    super.destroy();
  }
}

/** Native OpenTUI options for a Tabs List. */
export interface TabsListOptions extends BoxOptions {
  store: TabsStore;
}

/** Rendered-order and availability boundary for Tabs. */
export class TabsListRenderable extends RovingCollectionRenderable<
  TabsState,
  TabsTabCollectionState
> {
  private readonly _store: TabsStore;

  /** Creates a Tabs List Renderable. */
  constructor(ctx: RenderContext, options: TabsListOptions) {
    const { store, ...boxOptions } = options;
    store.assertListAvailable();
    super(ctx, boxOptions, store);
    this._store = store;
    store.attachList(this);
  }

  /** Store associated with this List. */
  get store(): TabsStore {
    return this._store;
  }

  /** Prevents replacement of a mounted List Store. */
  set store(store: TabsStore) {
    if (store !== this._store)
      throw new Error("Tabs.List store cannot be replaced");
  }

  protected itemKeyFor(child: BaseRenderable): TabsItemKey | null | undefined {
    return child instanceof TabsTabRenderable && child.store === this._store
      ? child.key
      : undefined;
  }

  /** Releases rendered-order ownership. */
  override destroy(): void {
    this._store.setCollectionAvailable(false);
    this._store.detachList(this);
    super.destroy();
  }
}

/** Native OpenTUI options plus one Tab's unique value. */
export interface TabsTabOptions extends BoxOptions {
  disabled?: boolean;
  store: TabsStore;
  value: string;
}

type TabsTabListener = (state: TabsTabState) => void;

/** Focusable and selectable Tab Part. */
export class TabsTabRenderable extends PressableRenderable {
  private readonly registration: CollectionItemRegistration;
  private collectionState: TabsTabCollectionState;
  private stateSnapshot: TabsTabState;
  private readonly stateListeners = new Set<TabsTabListener>();
  private readonly unsubscribe: () => void;
  private readonly _store: TabsStore;

  /** Creates a Tabs Tab Renderable. */
  constructor(ctx: RenderContext, options: TabsTabOptions) {
    const { disabled, store, value, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    this.registration = store.registerTab(value, {
      disabled,
      focus: () => this.focus(),
      isAvailable: () => this.isAvailable(),
    });
    const state = store.getItemState(this.registration.key);
    if (!state) throw new Error("Tabs.Tab registration failed");
    this.collectionState = state;
    this.stateSnapshot = this.createState();
    this._focusable = state.tabbable;
    this.unsubscribe = store.subscribe(() => this.syncState());
  }

  /** Stable collection identity for this Tab. */
  get key(): TabsItemKey {
    return this.registration.key;
  }

  /** Store associated with this Tab. */
  get store(): TabsStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Tab Store. */
  set store(store: TabsStore) {
    if (store !== this._store)
      throw new Error("Tabs.Tab store cannot be replaced");
  }

  /** Current immutable Tab state. */
  getState(): TabsTabState {
    return this.stateSnapshot;
  }

  /** Subscribes to Tab-local state. */
  subscribe(listener: TabsTabListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Selects this Tab imperatively. */
  select(): void {
    if (!this.refreshCollection()) return;
    this._store.select(this.collectionState.value);
  }

  /** Current Tab value. */
  get value(): string {
    return this.collectionState.value;
  }

  set value(value: string) {
    this.registration.setValue(value);
  }

  /** Whether this Tab is disabled by itself or Root. */
  get disabled(): boolean {
    return this.collectionState.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this.registration.setDisabled(disabled ?? false);
  }

  protected handlePress(details: PressDetails): void {
    if (!this.refreshCollection()) return;
    this._store.select(this.collectionState.value, details);
  }

  protected override pressableDisabled(): boolean {
    return this.collectionState.disabled;
  }

  protected override pressableFocusable(): boolean {
    return this.collectionState.tabbable || this._focused;
  }

  protected override handleUnclaimedKey(key: KeyEvent): boolean {
    const orientation = this._store.state.orientation;
    if (
      (orientation === "horizontal" && key.name === "left") ||
      (orientation === "vertical" && key.name === "up")
    )
      return this.moveFocus("previous");
    if (
      (orientation === "horizontal" && key.name === "right") ||
      (orientation === "vertical" && key.name === "down")
    )
      return this.moveFocus("next");
    if (key.name === "home") return this.moveFocus("first");
    if (key.name === "end") return this.moveFocus("last");
    return false;
  }

  override focus(): void {
    if (this.pressableDisabled() || !this.refreshCollection()) return;
    this._focusable = true;
    this.registration.setActive(true);
    super.focus();
    this.publishState();
  }

  override blur(): void {
    super.blur();
    this.registration.setActive(false);
    this.publishState();
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean) {
    if (super.visible === visible) return;
    const fallback =
      !visible && this._focused
        ? this._store.getFallbackTarget(this.key)
        : undefined;
    super.visible = visible;
    this.registration?.refreshAvailability();
    fallback?.focus();
  }

  /** Unregisters the Tab and releases subscriptions. */
  override destroy(): void {
    this.unsubscribe();
    this.registration.unregister();
    super.destroy();
    this.stateListeners.clear();
  }

  private moveFocus(direction: CollectionFocusDirection): boolean {
    const target = this._store.getNavigationTarget(this.key, direction);
    if (!target) return false;
    target.focus();
    if (this._store.state.activationMode === "automatic") {
      const state = this._store.getItemState(target.key);
      if (state) this._store.select(state.value, { source: "focus" });
    }
    return true;
  }

  private isAvailable(): boolean {
    if (this._isDestroyed || !this.visible) return false;
    let ancestor = this.parent;
    while (ancestor) {
      if (!ancestor.visible) return false;
      if (
        ancestor instanceof TabsListRenderable &&
        ancestor.store === this._store
      )
        return ancestor.parent !== null;
      ancestor = ancestor.parent;
    }
    return false;
  }

  private refreshCollection(): boolean {
    let ancestor = this.parent;
    while (ancestor) {
      if (
        ancestor instanceof TabsListRenderable &&
        ancestor.store === this._store
      ) {
        ancestor.refreshItems();
        return this.isAvailable();
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  private syncState(): void {
    const state = this._store.getItemState(this.key);
    if (!state) return;
    this.collectionState = state;
    if ((!state.available || state.disabled) && this._focused) super.blur();
    this._focusable = state.tabbable;
    this.publishState();
  }

  private createState(): TabsTabState {
    return Object.freeze({ ...this.collectionState, focused: this._focused });
  }

  private publishState(): void {
    const next = this.createState();
    if (
      Object.keys(next).every((key) =>
        Object.is(
          next[key as keyof TabsTabState],
          this.stateSnapshot[key as keyof TabsTabState],
        ),
      )
    )
      return;
    this.stateSnapshot = next;
    this.requestRender();
    for (const listener of this.stateListeners) listener(next);
  }
}

/** Native OpenTUI options plus one Panel's associated value. */
export interface TabsPanelOptions extends BoxOptions {
  store: TabsStore;
  value: string;
}

type TabsPanelListener = (state: TabsPanelState) => void;

/** State-reflecting content Panel associated with one Tab value. */
export class TabsPanelRenderable extends BoxRenderable {
  private consumerVisible: boolean;
  private readonly stateListeners = new Set<TabsPanelListener>();
  private readonly registration: ReturnType<TabsStore["registerPanel"]>;
  private stateSnapshot: TabsPanelState;
  private readonly _store: TabsStore;
  private readonly unsubscribe: () => void;
  private panelValue: string;

  /** Creates a Tabs Panel Renderable. */
  constructor(ctx: RenderContext, options: TabsPanelOptions) {
    const { store, value, visible = true, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: false });
    this._store = store;
    this.panelValue = value;
    this.consumerVisible = visible;
    this.registration = store.registerPanel(value, () => this.isAvailable());
    this.stateSnapshot = this.createState();
    this.unsubscribe = store.subscribe(() => this.syncState());
    this.syncState();
  }

  /** Store associated with this Panel. */
  get store(): TabsStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Panel Store. */
  set store(store: TabsStore) {
    if (store !== this._store)
      throw new Error("Tabs.Panel store cannot be replaced");
  }

  /** Current associated value. */
  get value(): string {
    return this.panelValue;
  }

  set value(value: string) {
    if (value === this.panelValue) return;
    this.registration.setValue(value);
    this.panelValue = value;
    this.syncState();
  }

  /** Current immutable Panel state. */
  getState(): TabsPanelState {
    return this.stateSnapshot;
  }

  /** Subscribes to Panel state. */
  subscribe(listener: TabsPanelListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean | null | undefined) {
    this.consumerVisible = visible ?? true;
    this.syncState();
    this.registration?.refresh();
  }

  protected override onUpdate(deltaTime: number): void {
    this.registration.refresh();
    super.onUpdate(deltaTime);
  }

  /** Unregisters Panel association and subscriptions. */
  override destroy(): void {
    this.unsubscribe();
    this.registration.unregister();
    this.stateListeners.clear();
    super.destroy();
  }

  private isAvailable(): boolean {
    if (this._isDestroyed || !this.consumerVisible) return false;
    let ancestor = this.parent;
    while (ancestor) {
      if (!ancestor.visible) return false;
      if (
        ancestor instanceof TabsRootRenderable &&
        ancestor.store === this._store
      )
        return ancestor.parent !== null;
      ancestor = ancestor.parent;
    }
    return false;
  }

  private createState(): TabsPanelState {
    return Object.freeze({
      active:
        this.consumerVisible &&
        this._store.state.value === this.panelValue &&
        this._store.hasAvailableTab(this.panelValue) &&
        this._store.hasAvailablePanel(this.panelValue),
      associated: this._store.hasAvailableTab(this.panelValue),
      value: this.panelValue,
    });
  }

  private syncState(): void {
    const next = this.createState();
    const changed =
      next.active !== this.stateSnapshot.active ||
      next.associated !== this.stateSnapshot.associated ||
      next.value !== this.stateSnapshot.value;
    if (super.visible !== next.active) super.visible = next.active;
    if (!changed) return;
    this.stateSnapshot = next;
    this.requestRender();
    for (const listener of this.stateListeners) listener(next);
  }
}
