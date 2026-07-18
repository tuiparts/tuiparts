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
  type CollectionItemRegistrationOptions,
  type CollectionNavigationTarget,
  type RegisteredCollectionItem,
  RovingCollectionRenderable,
  RovingCollectionStore,
} from "../internal/roving-collection";

export type RadioGroupItemKey = CollectionItemKey;

export interface RadioGroupChangeDetails {
  readonly reason: "activation" | "navigation";
  readonly source: "imperative" | "keyboard" | "pointer";
}

export type RadioGroupFocusDirection = CollectionFocusDirection;

export interface RadioGroupState {
  readonly value: string | null;
  readonly disabled: boolean;
}

export interface RadioGroupCollectionItemState {
  readonly value: string;
  readonly available: boolean;
  readonly disabled: boolean;
  readonly checked: boolean;
  readonly tabbable: boolean;
}

export interface RadioState extends RadioGroupCollectionItemState {
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

export type RadioGroupItemRegistrationOptions =
  CollectionItemRegistrationOptions;

export type RadioGroupItemRegistration = CollectionItemRegistration;

export type RadioGroupNavigationTarget = CollectionNavigationTarget;

const IMPERATIVE_ACTIVATION_DETAILS: RadioGroupChangeDetails = Object.freeze({
  reason: "activation",
  source: "imperative",
});

export class RadioGroupStore extends RovingCollectionStore<
  RadioGroupState,
  RadioGroupCollectionItemState
> {
  private _controlled: boolean;
  private _onValueChange?: RadioGroupValueChangeHandler;

  constructor(options: RadioGroupStoreOptions = {}) {
    super("RadioGroup", {
      value:
        options.value !== undefined
          ? options.value
          : (options.defaultValue ?? null),
      disabled: options.disabled ?? false,
    });
    this._controlled = options.value !== undefined;
    this._onValueChange = options.onValueChange;
  }

  requestSelection(
    key: RadioGroupItemKey,
    details: RadioGroupChangeDetails = IMPERATIVE_ACTIVATION_DETAILS,
  ): void {
    this.runMutation(() => this.requestSelectionNow(key, details));
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
      if (disabled) this.activeKey = null;
      this.update({ disabled });
    });
  }

  setOnValueChange(callback: RadioGroupValueChangeHandler | undefined): void {
    this._onValueChange = callback;
  }

  protected createItemState(
    key: RadioGroupItemKey,
    item: CollectionItemInput,
  ): RadioGroupCollectionItemState {
    return Object.freeze({
      value: item.value,
      available: this.collectionAvailable && (item.isAvailable?.() ?? true),
      disabled: this.state.disabled || item.disabled,
      checked: item.value === this.state.value,
      tabbable: key === this.tabStopKey,
    });
  }

  protected override preferredTabStop(
    enabled: ReadonlyArray<CollectionEntry<RadioGroupCollectionItemState>>,
  ): CollectionEntry<RadioGroupCollectionItemState> | undefined {
    return enabled.find(([, item]) => item.value === this.state.value);
  }

  protected override canActivate(
    item: RegisteredCollectionItem<RadioGroupCollectionItemState>,
  ): boolean {
    return !this.state.disabled && !item.disabled;
  }

  protected override onItemValueRenamed(
    previous: string,
    next: string,
  ): boolean {
    if (this._controlled || this.state.value !== previous) return false;
    this.update({ value: next });
    return true;
  }

  protected override onItemUnregistered(
    item: RegisteredCollectionItem<RadioGroupCollectionItemState>,
  ): boolean {
    if (this._controlled || this.state.value !== item.value) return false;
    this.update({ value: null });
    return true;
  }

  private requestSelectionNow(
    key: RadioGroupItemKey,
    details: RadioGroupChangeDetails,
  ): void {
    const item = this.items.get(key);
    if (
      this.state.disabled ||
      !this.collectionAvailable ||
      !item ||
      item.disabled ||
      !(item.isAvailable?.() ?? true) ||
      this.state.value === item.value
    ) {
      return;
    }

    if (!this._controlled) this.update({ value: item.value });
    this._onValueChange?.(item.value, Object.freeze({ ...details }));
  }
}

export interface RadioGroupOptions extends BoxOptions, RadioGroupStoreOptions {
  store?: RadioGroupStore;
}

export class RadioGroupRenderable extends RovingCollectionRenderable<
  RadioGroupState,
  RadioGroupCollectionItemState
> {
  private readonly _store: RadioGroupStore;

  constructor(ctx: RenderContext, options: RadioGroupOptions = {}) {
    const {
      store,
      value,
      defaultValue,
      disabled,
      onValueChange,
      ...boxOptions
    } = options;
    const groupStore =
      store ??
      new RadioGroupStore({ value, defaultValue, disabled, onValueChange });
    super(ctx, boxOptions, groupStore);
    this._store = groupStore;
  }

  get store(): RadioGroupStore {
    return this._store;
  }

  set store(store: RadioGroupStore) {
    if (store !== this._store)
      throw new Error("RadioGroup store cannot be replaced");
  }

  getState(): RadioGroupState {
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

  protected itemKeyFor(child: BaseRenderable): RadioGroupItemKey | undefined {
    return child instanceof RadioRootRenderable && child.store === this._store
      ? child.key
      : undefined;
  }
}

export interface RadioRootOptions extends BoxOptions {
  store: RadioGroupStore;
  value: string;
  disabled?: boolean;
}

type RadioGroupItemListener = (state: RadioState) => void;

export class RadioRootRenderable extends PressableRenderable {
  private readonly _store: RadioGroupStore;
  private readonly _registration: RadioGroupItemRegistration;
  private _collectionState: RadioGroupCollectionItemState;
  private _state: RadioState;
  private readonly _listeners = new Set<RadioGroupItemListener>();
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioRootOptions) {
    const { store, value, disabled, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    this._registration = store.registerItem(value, {
      disabled,
      focus: () => this.focus(),
      isAvailable: () => this.isAvailable(),
    });
    const state = store.getItemState(this._registration.key);
    if (!state) throw new Error("Radio registration failed");
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

  set store(store: RadioGroupStore) {
    if (store !== this._store)
      throw new Error("Radio.Root store cannot be replaced");
  }

  getState(): RadioState {
    return this._state;
  }

  subscribe(listener: RadioGroupItemListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  override press(
    source: RadioGroupChangeDetails["source"] = "imperative",
  ): void {
    if (this._state.disabled || !this.refreshCollection()) return;
    this._store.requestSelection(this.key, { reason: "activation", source });
  }

  /** Selects this Radio for one semantic press. */
  protected handlePress(details: PressDetails): void {
    this.press(details.source);
  }

  /** Radio disablement lives on its collection item state, not an attached Store. */
  protected override pressableDisabled(): boolean {
    return this._state.disabled;
  }

  /** Handles roving-focus navigation keys outside the activation map. */
  protected override handleUnclaimedKey(key: KeyEvent): boolean {
    if (key.name === "left" || key.name === "up") {
      return this.moveFocus("previous");
    }
    if (key.name === "right" || key.name === "down") {
      return this.moveFocus("next");
    }
    if (key.name === "home") return this.moveFocus("first");
    if (key.name === "end") return this.moveFocus("last");
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

  get checked(): boolean {
    return this._state.checked;
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
        ancestor instanceof RadioGroupRenderable &&
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
        ancestor instanceof RadioGroupRenderable &&
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

  private createState(): RadioState {
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
      state.checked === this._state.checked &&
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
      checked: false,
    });
    for (const listener of this._listeners) listener(this._state);
    this._listeners.clear();
  }
}

export interface RadioIndicatorOptions extends BoxOptions {
  radio: RadioRootRenderable;
}

export class RadioIndicatorRenderable extends BoxRenderable {
  private readonly _radio: RadioRootRenderable;
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioIndicatorOptions) {
    const { radio, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: radio.checked });
    this._radio = radio;
    this._unsubscribe = radio.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  getState(): RadioState {
    return this._radio.getState();
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
