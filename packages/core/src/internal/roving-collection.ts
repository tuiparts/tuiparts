import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";

export type CollectionItemKey = symbol;

export type CollectionFocusDirection = "next" | "previous" | "first" | "last";

export interface CollectionState {
  readonly disabled: boolean;
}

export interface CollectionItemState {
  readonly available: boolean;
  readonly disabled: boolean;
  readonly tabbable: boolean;
  readonly value: string;
}

export interface CollectionItemRegistrationOptions {
  readonly disabled?: boolean;
  readonly focus?: () => void;
  readonly isAvailable?: () => boolean;
}

export interface CollectionItemRegistration {
  readonly key: CollectionItemKey;
  refreshAvailability(): void;
  setActive(active: boolean): void;
  setDisabled(disabled: boolean): void;
  setValue(value: string): void;
  unregister(): void;
}

export interface CollectionNavigationTarget {
  readonly key: CollectionItemKey;
  focus(): void;
}

export interface CollectionItemInput {
  readonly disabled: boolean;
  readonly isAvailable?: () => boolean;
  readonly value: string;
}

export interface RegisteredCollectionItem<
  TItemState extends CollectionItemState,
> {
  disabled: boolean;
  focus?: () => void;
  isAvailable?: () => boolean;
  order: number;
  state: TItemState;
  value: string;
}

export type CollectionEntry<TItemState extends CollectionItemState> = [
  CollectionItemKey,
  RegisteredCollectionItem<TItemState>,
];

function statesEqual<T extends object>(left: T, right: T): boolean {
  return Object.keys(left).every((key) =>
    Object.is(left[key as keyof T], right[key as keyof T]),
  );
}

/**
 * Shared collection engine for roving-focus group primitives. Owns item
 * registration, availability, rendered ordering, the roving tab stop, and
 * re-entrant mutation queuing. Selection state stays in the subclass, which
 * customizes behavior through the protected hooks.
 */
export abstract class RovingCollectionStore<
  TState extends CollectionState,
  TItemState extends CollectionItemState,
> {
  private snapshot: TState;
  protected readonly items = new Map<
    CollectionItemKey,
    RegisteredCollectionItem<TItemState>
  >();
  protected activeKey: CollectionItemKey | null = null;
  protected tabStopKey: CollectionItemKey | null = null;
  protected collectionAvailable = true;
  private itemOrderResolver?: () => readonly CollectionItemKey[];
  private nextItemOrder = 0;
  private readonly listeners = new Set<(state: TState) => void>();
  private readonly mutationQueue: Array<() => void> = [];
  private mutating = false;
  private notificationDepth = 0;

  protected constructor(
    private readonly label: string,
    initialState: TState,
  ) {
    this.snapshot = Object.freeze(initialState);
  }

  /** Current immutable state snapshot. */
  get state(): TState {
    return this.snapshot;
  }

  /** Returns the immutable state for a registered item. */
  getItemState(key: CollectionItemKey): TItemState | undefined {
    return this.items.get(key)?.state;
  }

  /** Subscribes to observable state or collection changes. */
  subscribe(listener: (state: TState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Supplies the live rendered order for registered items. */
  setItemOrderResolver(
    resolver: () => readonly CollectionItemKey[],
  ): () => void {
    this.itemOrderResolver = resolver;
    return () => {
      if (this.itemOrderResolver === resolver)
        this.itemOrderResolver = undefined;
    };
  }

  /** Registers one item as a retained collection member. */
  registerItem(
    value: string,
    options: CollectionItemRegistrationOptions = {},
  ): CollectionItemRegistration {
    this.assertUniqueValue(value);
    const key = Symbol(value);
    const input = {
      disabled: options.disabled ?? false,
      focus: options.focus,
      isAvailable: options.isAvailable,
      order: this.nextItemOrder,
      value,
    };
    const item: RegisteredCollectionItem<TItemState> = {
      ...input,
      state: this.createItemState(key, input),
    };
    this.nextItemOrder += 1;
    this.items.set(key, item);
    this.reconcileTabStop();
    this.refreshItems();
    this.touch();

    return {
      key,
      refreshAvailability: () => {
        this.runMutation(() => {
          if (this.items.get(key) !== item) return;
          const previousActive = this.activeKey;
          const previousTabStop = this.tabStopKey;
          const focusLost =
            this.activeKey === key && !this.isItemAvailable(item);
          const fallback = focusLost ? this.getFocusFallback(key) : undefined;
          if (focusLost) this.activeKey = null;
          this.reconcileTabStop();
          const itemsChanged = this.refreshItems();
          if (
            previousActive !== this.activeKey ||
            previousTabStop !== this.tabStopKey ||
            itemsChanged
          )
            this.touch();
          fallback?.focus?.();
        });
      },
      setActive: (active) => {
        this.runMutation(() => {
          if (this.items.get(key) !== item) return;
          if (active && !this.canActivate(item)) return;
          const previousActive = this.activeKey;
          const previousTabStop = this.tabStopKey;
          if (active) this.activeKey = key;
          else if (this.activeKey === key) this.activeKey = null;
          this.reconcileTabStop();
          const itemsChanged = this.refreshItems();
          if (
            previousActive !== this.activeKey ||
            previousTabStop !== this.tabStopKey ||
            itemsChanged
          )
            this.touch();
        });
      },
      setDisabled: (disabled) => {
        this.runMutation(() => {
          if (this.items.get(key) !== item || item.disabled === disabled)
            return;
          const fallback =
            this.activeKey === key ? this.getFocusFallback(key) : undefined;
          item.disabled = disabled;
          if (disabled && this.activeKey === key) this.activeKey = null;
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
          if (disabled) fallback?.focus?.();
        });
      },
      setValue: (nextValue) => {
        this.runMutation(() => {
          if (this.items.get(key) !== item || item.value === nextValue) return;
          this.assertUniqueValue(nextValue, key);
          const previousValue = item.value;
          item.value = nextValue;
          if (this.onItemValueRenamed(previousValue, nextValue)) return;
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
        });
      },
      unregister: () => {
        this.runMutation(() => {
          if (this.items.get(key) !== item) return;
          this.unregisterItem(key, item);
        });
      },
    };
  }

  /** Returns the next eligible roving-focus target. */
  getNavigationTarget(
    from: CollectionItemKey,
    direction: CollectionFocusDirection,
  ): CollectionNavigationTarget | undefined {
    const candidates = this.getOrderedItems().filter(([, item]) =>
      this.isItemAvailable(item),
    );
    if (candidates.length === 0) return undefined;
    const currentIndex = candidates.findIndex(([key]) => key === from);
    const wrap = this.navigationWraps();
    let targetIndex: number;
    switch (direction) {
      case "first":
        targetIndex = 0;
        break;
      case "last":
        targetIndex = candidates.length - 1;
        break;
      case "previous":
        if (currentIndex <= 0 && !wrap) return undefined;
        targetIndex =
          currentIndex <= 0 ? candidates.length - 1 : currentIndex - 1;
        break;
      case "next":
        if (currentIndex === candidates.length - 1 && !wrap) return undefined;
        targetIndex =
          currentIndex < 0 || currentIndex === candidates.length - 1
            ? 0
            : currentIndex + 1;
        break;
    }
    const target = candidates[targetIndex];
    if (!target?.[1].focus) return undefined;
    return Object.freeze({ key: target[0], focus: target[1].focus });
  }

  /** Returns the nearest eligible focus target after an item becomes unavailable. */
  getFallbackTarget(
    from: CollectionItemKey,
  ): CollectionNavigationTarget | undefined {
    const item = this.getFocusFallback(from);
    if (!item?.focus) return undefined;
    const entry = [...this.items].find(([, candidate]) => candidate === item);
    return entry
      ? Object.freeze({ key: entry[0], focus: item.focus })
      : undefined;
  }

  /** Focuses the current tab stop when it is available. */
  focusTabStop(): boolean {
    if (!this.tabStopKey) return false;
    const item = this.items.get(this.tabStopKey);
    if (!item || !this.isItemAvailable(item)) return false;
    item.focus?.();
    return true;
  }

  /** Reconciles collection state with the current rendered order. */
  refreshItemOrder(): void {
    this.runMutation(() => {
      let focusLost = false;
      if (this.activeKey) {
        const item = this.items.get(this.activeKey);
        if (!item || !this.isItemAvailable(item)) {
          this.activeKey = null;
          focusLost = true;
        }
      }
      const previousTabStop = this.tabStopKey;
      this.reconcileTabStop();
      const itemsChanged = this.refreshItems();
      if (previousTabStop !== this.tabStopKey || itemsChanged) this.touch();
      if (focusLost) this.focusTabStop();
    });
  }

  /** Marks whether the rendered collection is currently available. */
  setCollectionAvailable(available: boolean): void {
    this.runMutation(() => {
      if (this.collectionAvailable === available) return;
      this.collectionAvailable = available;
      if (!available) this.activeKey = null;
      this.reconcileTabStop();
      this.refreshItems();
      this.touch();
    });
  }

  /** Builds the frozen published state for one registered item. */
  protected abstract createItemState(
    key: CollectionItemKey,
    item: CollectionItemInput,
  ): TItemState;

  /** Tab-stop candidate preferred after the active item, before the retained one. */
  protected preferredTabStop(
    _enabled: ReadonlyArray<CollectionEntry<TItemState>>,
  ): CollectionEntry<TItemState> | undefined {
    return undefined;
  }

  /** Whether roving-focus navigation wraps at the collection edges. */
  protected navigationWraps(): boolean {
    return true;
  }

  /** Whether an item may take active (focused) collection ownership. */
  protected canActivate(item: RegisteredCollectionItem<TItemState>): boolean {
    return this.isItemAvailable(item);
  }

  /** Migrates selection after an item's value changes; true when state was updated. */
  protected onItemValueRenamed(_previous: string, _next: string): boolean {
    return false;
  }

  /** Repairs selection after an item unregisters; true when state was updated. */
  protected onItemUnregistered(
    _item: RegisteredCollectionItem<TItemState>,
  ): boolean {
    return false;
  }

  protected update(next: Partial<TState>): void {
    const state = { ...this.snapshot, ...next };
    if (statesEqual(state, this.snapshot)) return;
    this.snapshot = Object.freeze(state);
    this.reconcileTabStop();
    this.refreshItems();
    this.notify();
  }

  protected touch(): void {
    this.snapshot = Object.freeze({ ...this.snapshot });
    this.notify();
  }

  protected runMutation(mutation: () => void): void {
    if (this.mutating || this.notificationDepth > 0) {
      this.mutationQueue.push(mutation);
      return;
    }
    this.mutating = true;
    try {
      mutation();
      while (this.mutationQueue.length > 0) this.mutationQueue.shift()?.();
    } finally {
      this.mutating = false;
    }
  }

  /** Releases collection listeners and retained coordination state. */
  protected disposeCollection(): void {
    this.listeners.clear();
    this.mutationQueue.length = 0;
    this.itemOrderResolver = undefined;
    this.items.clear();
    this.activeKey = null;
    this.tabStopKey = null;
  }

  protected isItemAvailable(
    item: RegisteredCollectionItem<TItemState>,
  ): boolean {
    return (
      !this.snapshot.disabled &&
      this.collectionAvailable &&
      !item.disabled &&
      (item.isAvailable?.() ?? true) &&
      item.focus !== undefined
    );
  }

  protected reconcileTabStop(): void {
    if (this.snapshot.disabled || !this.collectionAvailable) {
      this.tabStopKey = null;
      return;
    }
    const enabled = this.getOrderedItems().filter(
      ([, item]) => !item.disabled && (item.isAvailable?.() ?? true),
    );
    const active = enabled.find(([key]) => key === this.activeKey);
    const preferred = this.preferredTabStop(enabled);
    const retained = enabled.find(([key]) => key === this.tabStopKey);
    this.tabStopKey =
      (active ?? preferred ?? retained ?? enabled[0])?.[0] ?? null;
  }

  protected refreshItems(): boolean {
    let changed = false;
    for (const [key, item] of this.items) {
      const state = this.createItemState(key, item);
      if (statesEqual(state, item.state)) continue;
      item.state = state;
      changed = true;
    }
    return changed;
  }

  private unregisterItem(
    key: CollectionItemKey,
    item: RegisteredCollectionItem<TItemState>,
  ): void {
    const fallback =
      this.activeKey === key ? this.getFocusFallback(key) : undefined;
    if (this.activeKey === key) this.activeKey = null;
    this.items.delete(key);
    this.reconcileTabStop();
    if (!this.onItemUnregistered(item)) {
      this.refreshItems();
      this.touch();
    }
    fallback?.focus?.();
  }

  private assertUniqueValue(
    value: string,
    excludedKey?: CollectionItemKey,
  ): void {
    for (const [key, item] of this.items) {
      if (key !== excludedKey && item.value === value) {
        throw new Error(
          `${this.label} item value "${value}" is already registered`,
        );
      }
    }
  }

  private getFocusFallback(
    key: CollectionItemKey,
  ): RegisteredCollectionItem<TItemState> | undefined {
    const items = this.getOrderedItems(false);
    const index = items.findIndex(([itemKey]) => itemKey === key);
    if (index < 0) {
      const removed = this.items.get(key);
      if (!removed) return undefined;
      return (
        items.find(([, item]) => item.order > removed.order)?.[1] ??
        items.findLast(([, item]) => item.order < removed.order)?.[1]
      );
    }
    for (let next = index + 1; next < items.length; next += 1) {
      const item = items[next]?.[1];
      if (item && this.isItemAvailable(item)) return item;
    }
    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const item = items[previous]?.[1];
      if (item && this.isItemAvailable(item)) return item;
    }
    return undefined;
  }

  /** Returns registered members in current rendered order. */
  protected getOrderedItems(
    updateOrder = true,
  ): Array<CollectionEntry<TItemState>> {
    if (!this.itemOrderResolver) return [...this.items];
    const resolvedKeys = this.itemOrderResolver();
    const completeOrder = resolvedKeys.length === this.items.size;
    const seen = new Set<CollectionItemKey>();
    const items: Array<CollectionEntry<TItemState>> = [];
    for (const key of resolvedKeys) {
      const item = this.items.get(key);
      if (!item || seen.has(key)) continue;
      if (updateOrder && completeOrder) item.order = items.length;
      seen.add(key);
      items.push([key, item]);
    }
    return items;
  }

  private notify(): void {
    const state = this.snapshot;
    this.notificationDepth += 1;
    try {
      for (const listener of [...this.listeners]) listener(state);
    } finally {
      this.notificationDepth -= 1;
    }
  }
}

/**
 * Non-focusable Renderable that owns one roving collection: it wires the
 * rendered item order into the Store, tracks collection availability across
 * mount/visibility changes, and re-renders on Store notifications.
 */
export abstract class RovingCollectionRenderable<
  TState extends CollectionState,
  TItemState extends CollectionItemState,
> extends BoxRenderable {
  protected override _focusable = false;

  private readonly collection: RovingCollectionStore<TState, TItemState>;
  private readonly removeItemOrderResolver: () => void;
  private readonly unsubscribeCollection: () => void;

  protected constructor(
    ctx: RenderContext,
    options: BoxOptions,
    collection: RovingCollectionStore<TState, TItemState>,
  ) {
    super(ctx, options);
    this.collection = collection;
    this.removeItemOrderResolver = collection.setItemOrderResolver(() =>
      this.getItemOrder(),
    );
    collection.setCollectionAvailable(false);
    this.unsubscribeCollection = collection.subscribe(() =>
      this.requestRender(),
    );
    // Hidden subtrees are skipped by OpenTUI layout updates, but lifecycle
    // passes still run and can repair collection availability.
    this.onLifecyclePass = () => this.refreshItems();
  }

  /**
   * Classifies one child during the rendered-order walk: a key registers the
   * child as an item, null marks an unkeyed item (skipped, not descended
   * into), and undefined descends into the child's subtree.
   */
  protected abstract itemKeyFor(
    child: BaseRenderable,
  ): CollectionItemKey | null | undefined;

  /** Reconciles live collection availability and order. */
  refreshItems(): void {
    this.collection.setCollectionAvailable(this.isTreeAvailable());
    this.collection.refreshItemOrder();
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean) {
    if (super.visible === visible) return;
    super.visible = visible;
    this.collection?.setCollectionAvailable(this.isTreeAvailable());
    this.collection?.refreshItemOrder();
  }

  protected override onUpdate(deltaTime: number): void {
    this.refreshItems();
    super.onUpdate(deltaTime);
  }

  protected override onRemove(): void {
    this.collection.setCollectionAvailable(false);
    super.onRemove();
  }

  /** Releases collection subscriptions and ownership. */
  override destroy(): void {
    this.removeItemOrderResolver();
    this.unsubscribeCollection();
    super.destroy();
  }

  private getItemOrder(): CollectionItemKey[] {
    const keys: CollectionItemKey[] = [];
    const visit = (node: BaseRenderable) => {
      for (const child of node.getChildren()) {
        if (!child.visible) continue;
        const key = this.itemKeyFor(child);
        if (key === undefined) visit(child);
        else if (key !== null) keys.push(key);
      }
    };
    visit(this);
    return keys;
  }

  private isTreeAvailable(): boolean {
    const renderRoot = "root" in this._ctx ? this._ctx.root : undefined;
    let current: BaseRenderable | null = this;
    while (current) {
      if (!current.visible) return false;
      if (current.parent === null) return current === renderRoot;
      current = current.parent;
    }
    return false;
  }
}
