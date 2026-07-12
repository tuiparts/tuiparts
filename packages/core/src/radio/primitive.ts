import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";

export type RadioGroupItemKey = symbol;

export interface RadioGroupChangeDetails {
  readonly reason: "activation" | "navigation";
  readonly source: "keyboard" | "pointer" | "programmatic";
}

export type RadioGroupFocusDirection = "next" | "previous" | "first" | "last";

export interface RadioGroupPrimitiveState {
  readonly value: string | null;
  readonly disabled: boolean;
}

export interface RadioGroupCollectionItemState {
  readonly value: string;
  readonly available: boolean;
  readonly disabled: boolean;
  readonly selected: boolean;
  readonly tabbable: boolean;
}

export interface RadioGroupItemState extends RadioGroupCollectionItemState {
  readonly focused: boolean;
}

export type RadioGroupValueChangeHandler = (
  value: string,
  details: RadioGroupChangeDetails,
) => void;

export interface RadioGroupStoreOptions {
  value?: string | null;
  defaultValue?: string | null;
  disabled?: boolean;
  onValueChange?: RadioGroupValueChangeHandler;
}

export interface RadioGroupItemRegistrationOptions {
  disabled?: boolean;
  focus?: () => void;
  isAvailable?: () => boolean;
}

export interface RadioGroupItemRegistration {
  readonly key: RadioGroupItemKey;
  refreshAvailability(): void;
  setDisabled(disabled: boolean): void;
  setActive(active: boolean): void;
  setValue(value: string): void;
  unregister(): void;
}

export interface RadioGroupNavigationTarget {
  readonly key: RadioGroupItemKey;
  focus(): void;
}

type RadioGroupStoreListener = (state: RadioGroupPrimitiveState) => void;

interface RegisteredItem {
  value: string;
  disabled: boolean;
  order: number;
  focus?: () => void;
  isAvailable?: () => boolean;
  state: RadioGroupCollectionItemState;
}

const PROGRAMMATIC_ACTIVATION_DETAILS: RadioGroupChangeDetails = Object.freeze({
  reason: "activation",
  source: "programmatic",
});

export class RadioGroupStore {
  private _controlled: boolean;
  private _state: RadioGroupPrimitiveState;
  private _onValueChange?: RadioGroupValueChangeHandler;
  private readonly _items = new Map<RadioGroupItemKey, RegisteredItem>();
  private _activeKey: RadioGroupItemKey | null = null;
  private _tabStopKey: RadioGroupItemKey | null = null;
  private _collectionAvailable = true;
  private _itemOrderResolver?: () => readonly RadioGroupItemKey[];
  private _nextItemOrder = 0;
  private readonly _listeners = new Set<RadioGroupStoreListener>();
  private readonly _mutationQueue: Array<() => void> = [];
  private _mutating = false;
  private _notificationDepth = 0;

  constructor(options: RadioGroupStoreOptions = {}) {
    this._controlled = options.value !== undefined;
    this._state = Object.freeze({
      value:
        options.value !== undefined
          ? options.value
          : (options.defaultValue ?? null),
      disabled: options.disabled ?? false,
    });
    this._onValueChange = options.onValueChange;
  }

  get state(): RadioGroupPrimitiveState {
    return this._state;
  }

  getItemState(
    key: RadioGroupItemKey,
  ): RadioGroupCollectionItemState | undefined {
    return this._items.get(key)?.state;
  }

  subscribe(listener: RadioGroupStoreListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  setItemOrderResolver(
    resolver: () => readonly RadioGroupItemKey[],
  ): () => void {
    this._itemOrderResolver = resolver;
    return () => {
      if (this._itemOrderResolver === resolver)
        this._itemOrderResolver = undefined;
    };
  }

  registerItem(
    value: string,
    options: RadioGroupItemRegistrationOptions = {},
  ): RadioGroupItemRegistration {
    this.assertUniqueValue(value);
    const key = Symbol(value);
    const item: RegisteredItem = {
      value,
      disabled: options.disabled ?? false,
      order: this._nextItemOrder,
      focus: options.focus,
      isAvailable: options.isAvailable,
      state: Object.freeze({
        value,
        available: options.isAvailable?.() ?? true,
        disabled: this._state.disabled || (options.disabled ?? false),
        selected: value === this._state.value,
        tabbable: false,
      }),
    };
    this._nextItemOrder += 1;
    this._items.set(key, item);
    this.reconcileTabStop();
    this.refreshItems();
    this.touch();

    return {
      key,
      refreshAvailability: () => {
        this.runMutation(() => {
          if (this._items.get(key) !== item) return;
          const focusLost =
            this._activeKey === key && !this.isItemAvailable(item);
          const fallback = focusLost ? this.getFocusFallback(key) : undefined;
          if (focusLost) this._activeKey = null;
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
          fallback?.focus?.();
        });
      },
      setDisabled: (disabled) => {
        this.runMutation(() => {
          if (this._items.get(key) !== item || item.disabled === disabled)
            return;
          const fallback =
            this._activeKey === key ? this.getFocusFallback(key) : undefined;
          item.disabled = disabled;
          if (disabled && this._activeKey === key) this._activeKey = null;
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
          if (disabled) fallback?.focus?.();
        });
      },
      setActive: (active) => {
        this.runMutation(() => {
          if (this._items.get(key) !== item) return;
          if (active && (this._state.disabled || item.disabled)) return;
          if (active) this._activeKey = key;
          else if (this._activeKey === key) this._activeKey = null;
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
        });
      },
      setValue: (nextValue) => {
        this.runMutation(() => {
          if (this._items.get(key) !== item || item.value === nextValue) return;
          this.assertUniqueValue(nextValue, key);
          const previousValue = item.value;
          item.value = nextValue;
          if (!this._controlled && this._state.value === previousValue) {
            this.update({ value: nextValue });
            return;
          }
          this.reconcileTabStop();
          this.refreshItems();
          this.touch();
        });
      },
      unregister: () => {
        this.runMutation(() => {
          if (this._items.get(key) !== item) return;
          this.unregisterItem(key, item);
        });
      },
    };
  }

  requestSelection(
    key: RadioGroupItemKey,
    details: RadioGroupChangeDetails = PROGRAMMATIC_ACTIVATION_DETAILS,
  ): void {
    this.runMutation(() => this.requestSelectionNow(key, details));
  }

  getNavigationTarget(
    from: RadioGroupItemKey,
    direction: RadioGroupFocusDirection,
  ): RadioGroupNavigationTarget | undefined {
    const candidates = this.getOrderedItems().filter(([, item]) =>
      this.isItemAvailable(item),
    );
    if (candidates.length === 0) return undefined;

    const currentIndex = candidates.findIndex(([key]) => key === from);
    let targetIndex: number;
    switch (direction) {
      case "first":
        targetIndex = 0;
        break;
      case "last":
        targetIndex = candidates.length - 1;
        break;
      case "previous":
        targetIndex =
          currentIndex <= 0 ? candidates.length - 1 : currentIndex - 1;
        break;
      case "next":
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

  getFallbackTarget(
    from: RadioGroupItemKey,
  ): RadioGroupNavigationTarget | undefined {
    const item = this.getFocusFallback(from);
    if (!item?.focus) return undefined;
    const entry = [...this._items].find(([, candidate]) => candidate === item);
    return entry
      ? Object.freeze({ key: entry[0], focus: item.focus })
      : undefined;
  }

  focusTabStop(): boolean {
    if (!this._tabStopKey) return false;
    const item = this._items.get(this._tabStopKey);
    if (!item || !this.isItemAvailable(item)) return false;
    item.focus?.();
    return true;
  }

  refreshItemOrder(): void {
    this.runMutation(() => {
      let focusLost = false;
      if (this._activeKey) {
        const item = this._items.get(this._activeKey);
        if (!item || !this.isItemAvailable(item)) {
          this._activeKey = null;
          focusLost = true;
        }
      }
      const previousTabStop = this._tabStopKey;
      this.reconcileTabStop();
      const itemsChanged = this.refreshItems();
      if (previousTabStop !== this._tabStopKey || itemsChanged) this.touch();
      if (focusLost) this.focusTabStop();
    });
  }

  setCollectionAvailable(available: boolean): void {
    this.runMutation(() => {
      if (this._collectionAvailable === available) return;
      this._collectionAvailable = available;
      if (!available) this._activeKey = null;
      this.reconcileTabStop();
      this.refreshItems();
      this.touch();
    });
  }

  setValue(value: string | null | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this._controlled = false;
        return;
      }
      this._controlled = true;
      this.update({ value });
    });
  }

  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) this._activeKey = null;
      this.update({ disabled });
    });
  }

  setOnValueChange(callback: RadioGroupValueChangeHandler | undefined): void {
    this._onValueChange = callback;
  }

  private unregisterItem(key: RadioGroupItemKey, item: RegisteredItem): void {
    const fallback =
      this._activeKey === key ? this.getFocusFallback(key) : undefined;
    if (this._activeKey === key) this._activeKey = null;
    this._items.delete(key);
    this.reconcileTabStop();
    if (!this._controlled && this._state.value === item.value) {
      this.update({ value: null });
    } else {
      this.refreshItems();
      this.touch();
    }
    fallback?.focus?.();
  }

  private requestSelectionNow(
    key: RadioGroupItemKey,
    details: RadioGroupChangeDetails,
  ): void {
    const item = this._items.get(key);
    if (
      this._state.disabled ||
      !this._collectionAvailable ||
      !item ||
      item.disabled ||
      !(item.isAvailable?.() ?? true) ||
      this._state.value === item.value
    ) {
      return;
    }

    if (!this._controlled) this.update({ value: item.value });
    this._onValueChange?.(item.value, Object.freeze({ ...details }));
  }

  private assertUniqueValue(
    value: string,
    excludedKey?: RadioGroupItemKey,
  ): void {
    for (const [key, item] of this._items) {
      if (key !== excludedKey && item.value === value) {
        throw new Error(
          `RadioGroup item value "${value}" is already registered`,
        );
      }
    }
  }

  private isItemAvailable(item: RegisteredItem): boolean {
    return (
      !this._state.disabled &&
      this._collectionAvailable &&
      !item.disabled &&
      (item.isAvailable?.() ?? true) &&
      item.focus !== undefined
    );
  }

  private getFocusFallback(key: RadioGroupItemKey): RegisteredItem | undefined {
    const items = this.getOrderedItems(false);
    const index = items.findIndex(([itemKey]) => itemKey === key);
    if (index < 0) {
      const removed = this._items.get(key);
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

  private getOrderedItems(
    updateOrder = true,
  ): Array<[RadioGroupItemKey, RegisteredItem]> {
    if (!this._itemOrderResolver) return [...this._items];
    const resolvedKeys = this._itemOrderResolver();
    const completeOrder = resolvedKeys.length === this._items.size;
    const seen = new Set<RadioGroupItemKey>();
    const items: Array<[RadioGroupItemKey, RegisteredItem]> = [];
    for (const key of resolvedKeys) {
      const item = this._items.get(key);
      if (!item || seen.has(key)) continue;
      if (updateOrder && completeOrder) item.order = items.length;
      seen.add(key);
      items.push([key, item]);
    }
    return items;
  }

  private createItemState(
    key: RadioGroupItemKey,
    item: RegisteredItem,
  ): RadioGroupCollectionItemState {
    return Object.freeze({
      value: item.value,
      available: this._collectionAvailable && (item.isAvailable?.() ?? true),
      disabled: this._state.disabled || item.disabled,
      selected: item.value === this._state.value,
      tabbable: key === this._tabStopKey,
    });
  }

  private refreshItem(key: RadioGroupItemKey, item: RegisteredItem): void {
    const state = this.createItemState(key, item);
    if (
      state.value === item.state.value &&
      state.available === item.state.available &&
      state.disabled === item.state.disabled &&
      state.selected === item.state.selected &&
      state.tabbable === item.state.tabbable
    ) {
      return;
    }
    item.state = state;
  }

  private refreshItems(): boolean {
    let changed = false;
    for (const [key, item] of this._items) {
      const state = item.state;
      this.refreshItem(key, item);
      if (state !== item.state) changed = true;
    }
    return changed;
  }

  private reconcileTabStop(): void {
    if (this._state.disabled || !this._collectionAvailable) {
      this._tabStopKey = null;
      return;
    }

    const enabledItems = this.getOrderedItems().filter(
      ([, item]) => !item.disabled && (item.isAvailable?.() ?? true),
    );
    const active = enabledItems.find(([key]) => key === this._activeKey);
    const selected = enabledItems.find(
      ([, item]) => item.value === this._state.value,
    );
    const retained = enabledItems.find(([key]) => key === this._tabStopKey);
    this._tabStopKey =
      (active ?? selected ?? retained ?? enabledItems[0])?.[0] ?? null;
  }

  private update(next: Partial<RadioGroupPrimitiveState>): void {
    const state = { ...this._state, ...next };
    if (
      state.value === this._state.value &&
      state.disabled === this._state.disabled
    ) {
      return;
    }
    this._state = Object.freeze(state);
    this.reconcileTabStop();
    this.refreshItems();
    this.notify();
  }

  private notify(): void {
    const state = this._state;
    this._notificationDepth += 1;
    try {
      for (const listener of [...this._listeners]) listener(state);
    } finally {
      this._notificationDepth -= 1;
    }
  }

  private touch(): void {
    this._state = Object.freeze({ ...this._state });
    this.notify();
  }

  private runMutation(mutation: () => void): void {
    if (this._mutating || this._notificationDepth > 0) {
      this._mutationQueue.push(mutation);
      return;
    }

    this._mutating = true;
    try {
      mutation();
      while (this._mutationQueue.length > 0) this._mutationQueue.shift()?.();
    } finally {
      this._mutating = false;
    }
  }
}

export interface RadioGroupRootOptions
  extends BoxOptions,
    RadioGroupStoreOptions {
  store?: RadioGroupStore;
}

export class RadioGroupRootRenderable extends BoxRenderable {
  protected override _focusable = false;

  private readonly _store: RadioGroupStore;
  private readonly _removeItemOrderResolver: () => void;
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupRootOptions = {}) {
    const {
      store,
      value,
      defaultValue,
      disabled,
      onValueChange,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._store =
      store ??
      new RadioGroupStore({ value, defaultValue, disabled, onValueChange });
    this._removeItemOrderResolver = this._store.setItemOrderResolver(() =>
      this.getItemOrder(),
    );
    this._store.setCollectionAvailable(false);
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  get store(): RadioGroupStore {
    return this._store;
  }

  getState(): RadioGroupPrimitiveState {
    return this._store.state;
  }

  get value(): string | null {
    return this._store.state.value;
  }

  set value(value: string | null | undefined) {
    this._store.setValue(value);
  }

  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  set onValueChange(callback: RadioGroupValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  refreshItems(): void {
    this._store.setCollectionAvailable(this.visible && this.parent !== null);
    this._store.refreshItemOrder();
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean) {
    if (super.visible === visible) return;
    super.visible = visible;
    this._store?.setCollectionAvailable(visible && this.parent !== null);
    this._store?.refreshItemOrder();
  }

  private getItemOrder(): RadioGroupItemKey[] {
    const keys: RadioGroupItemKey[] = [];
    const visit = (node: BaseRenderable) => {
      for (const child of node.getChildren()) {
        if (!child.visible) continue;
        if (
          child instanceof RadioGroupItemRenderable &&
          child.store === this._store
        ) {
          keys.push(child.key);
        } else {
          visit(child);
        }
      }
    };
    visit(this);
    return keys;
  }

  protected override onUpdate(deltaTime: number): void {
    this.refreshItems();
    super.onUpdate(deltaTime);
  }

  protected override onRemove(): void {
    this._store.setCollectionAvailable(false);
    super.onRemove();
  }

  override destroy(): void {
    this._removeItemOrderResolver();
    this._unsubscribe();
    super.destroy();
  }
}

export interface RadioGroupItemOptions extends BoxOptions {
  store: RadioGroupStore;
  value: string;
  disabled?: boolean;
}

type RadioGroupItemListener = (state: RadioGroupItemState) => void;

export class RadioGroupItemRenderable extends BoxRenderable {
  protected override _focusable = true;

  private readonly _store: RadioGroupStore;
  private readonly _registration: RadioGroupItemRegistration;
  private _collectionState: RadioGroupCollectionItemState;
  private _state: RadioGroupItemState;
  private readonly _listeners = new Set<RadioGroupItemListener>();
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupItemOptions) {
    const { store, value, disabled, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          this._state.disabled
        )
          return;
        this.focus();
        this.press("pointer");
      },
    });
    this._store = store;
    this._registration = store.registerItem(value, {
      disabled,
      focus: () => this.focus(),
      isAvailable: () => this.isAvailable(),
    });
    const state = store.getItemState(this._registration.key);
    if (!state) throw new Error("RadioGroup Item registration failed");
    this._collectionState = state;
    this._state = this.createState();
    this._focusable = state.tabbable;
    this._unsubscribe = store.subscribe(() => {
      const state = store.getItemState(this._registration.key);
      if (!state || state === this._collectionState) return;
      this._collectionState = state;
      if ((!state.available || state.disabled) && this._focused) {
        super.blur();
        this._focusable = state.tabbable;
        this._registration.setActive(false);
        this.publishState();
        return;
      }
      this._focusable = state.tabbable || this._focused;
      this.publishState();
    });
  }

  get key(): RadioGroupItemKey {
    return this._registration.key;
  }

  get store(): RadioGroupStore {
    return this._store;
  }

  getState(): RadioGroupItemState {
    return this._state;
  }

  subscribe(listener: RadioGroupItemListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  press(source: RadioGroupChangeDetails["source"] = "programmatic"): void {
    if (this._state.disabled || !this.refreshCollection()) return;
    this._store.requestSelection(this.key, { reason: "activation", source });
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._state.disabled) return false;
    if (
      key.ctrl ||
      key.meta ||
      key.shift ||
      key.option ||
      key.super ||
      key.hyper
    )
      return false;
    if (key.name === "left" || key.name === "up") {
      return this.moveFocus("previous");
    }
    if (key.name === "right" || key.name === "down") {
      return this.moveFocus("next");
    }
    if (key.name === "home") return this.moveFocus("first");
    if (key.name === "end") return this.moveFocus("last");
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.press("keyboard");
      return true;
    }
    return false;
  }

  override focus(): void {
    if (this._state.disabled || !this.refreshCollection()) return;
    this._focusable = true;
    this._registration.setActive(true);
    super.focus();
    this.publishState();
  }

  override blur(): void {
    super.blur();
    this._registration.setActive(false);
    this.publishState();
  }

  get selected(): boolean {
    return this._state.selected;
  }

  get value(): string {
    return this._state.value;
  }

  set value(value: string) {
    this._registration.setValue(value);
  }

  get disabled(): boolean {
    return this._state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._registration.setDisabled(disabled ?? false);
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
    this._registration?.refreshAvailability();
    if (this._collectionState) this._focusable = this._collectionState.tabbable;
    fallback?.focus();
  }

  private isAvailable(): boolean {
    if (this._isDestroyed || !this.visible) return false;
    let ancestor = this.parent;
    while (ancestor) {
      if (!ancestor.visible) return false;
      if (
        ancestor instanceof RadioGroupRootRenderable &&
        ancestor.store === this._store
      ) {
        return ancestor.parent !== null;
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  private refreshCollection(): boolean {
    let ancestor = this.parent;
    while (ancestor) {
      if (
        ancestor instanceof RadioGroupRootRenderable &&
        ancestor.store === this._store
      ) {
        ancestor.refreshItems();
        return this.isAvailable();
      }
      ancestor = ancestor.parent;
    }
    return false;
  }

  private moveFocus(direction: RadioGroupFocusDirection): boolean {
    const target = this._store.getNavigationTarget(this.key, direction);
    if (!target) return false;
    this._store.requestSelection(target.key, {
      reason: "navigation",
      source: "keyboard",
    });
    target.focus();
    return true;
  }

  private createState(): RadioGroupItemState {
    return Object.freeze({
      ...this._collectionState,
      focused: this._focused,
    });
  }

  private publishState(): void {
    const state = this.createState();
    if (
      state.value === this._state.value &&
      state.available === this._state.available &&
      state.disabled === this._state.disabled &&
      state.focused === this._state.focused &&
      state.selected === this._state.selected &&
      state.tabbable === this._state.tabbable
    ) {
      return;
    }
    this._state = state;
    this.requestRender();
    for (const listener of this._listeners) listener(state);
  }

  override destroy(): void {
    this._unsubscribe();
    this._registration.unregister();
    super.destroy();
    this._state = Object.freeze({
      ...this._state,
      available: false,
      disabled: true,
      focused: false,
      selected: false,
    });
    for (const listener of this._listeners) listener(this._state);
    this._listeners.clear();
  }
}

export interface RadioGroupIndicatorOptions extends BoxOptions {
  item: RadioGroupItemRenderable;
}

export class RadioGroupIndicatorRenderable extends BoxRenderable {
  private readonly _item: RadioGroupItemRenderable;
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupIndicatorOptions) {
    const { item, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: item.selected });
    this._item = item;
    this._unsubscribe = item.subscribe((state) => {
      this.visible = state.selected;
    });
  }

  getState(): RadioGroupItemState {
    return this._item.getState();
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
