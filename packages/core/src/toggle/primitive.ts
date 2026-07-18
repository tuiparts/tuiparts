import type { BoxOptions, KeyEvent, RenderContext } from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";
import {
  type ToggleGroupFocusDirection,
  type ToggleGroupItemKey,
  type ToggleGroupItemRegistration,
  type ToggleGroupItemState,
  ToggleGroupRenderable,
  type ToggleGroupStore,
} from "../toggle-group/primitive";

/** Gesture details for one semantic Toggle press. */
export type ToggleChangeDetails = PressDetails;

/** Readonly observable Toggle state. */
export interface ToggleState {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly pressed: boolean;
  readonly tabbable: boolean;
}

/** Callback invoked when a Toggle requests a pressed-state change. */
export type TogglePressedChangeHandler = (
  pressed: boolean,
  details: ToggleChangeDetails,
) => void;

/** Options used to construct a Toggle Store. */
export interface ToggleStoreOptions {
  readonly defaultPressed?: boolean;
  readonly disabled?: boolean;
  readonly group?: ToggleGroupStore;
  readonly onPressedChange?: TogglePressedChangeHandler;
  readonly pressed?: boolean;
  readonly value?: string;
}

type ToggleStateListener = (state: ToggleState) => void;

/** Framework-neutral owner for standalone or grouped Toggle state. */
export class ToggleStore {
  private controlled: boolean;
  private snapshot: ToggleState;
  private _disabled: boolean;
  private _pressed: boolean;
  private _value?: string;
  private onPressedChangeCallback?: TogglePressedChangeHandler;
  private registration?: ToggleGroupItemRegistration;
  private collectionState?: ToggleGroupItemState;
  private readonly listeners = new Set<ToggleStateListener>();
  private unsubscribeGroup?: () => void;

  /** Creates a Toggle Store. */
  constructor(options: ToggleStoreOptions = {}) {
    if (options.group && options.value === undefined) {
      throw new Error("A Toggle inside ToggleGroup requires a value");
    }
    this.controlled = !options.group && options.pressed !== undefined;
    this._disabled = options.disabled ?? false;
    this._pressed = options.pressed ?? options.defaultPressed ?? false;
    this._value = options.value;
    this.group = options.group;
    this.onPressedChangeCallback = options.onPressedChange;
    const groupPressed =
      this.group && this._value !== undefined
        ? this.group.state.value.includes(this._value)
        : undefined;
    const disabled = this.group?.state.disabled || this._disabled;
    this.snapshot = Object.freeze({
      disabled,
      focused: false,
      pressed: groupPressed ?? this._pressed,
      tabbable: !this.group && !disabled,
    });
  }

  /** Optional ToggleGroup owner. */
  readonly group?: ToggleGroupStore;

  /** Current immutable Toggle state. */
  get state(): ToggleState {
    return this.snapshot;
  }

  /** Current immutable Toggle state. */
  getState(): ToggleState {
    return this.snapshot;
  }

  /** Current group registration key, when mounted in a ToggleGroup. */
  get groupKey(): ToggleGroupItemKey | undefined {
    return this.registration?.key;
  }

  /** Current group collection state, when mounted in a ToggleGroup. */
  get groupState(): ToggleGroupItemState | undefined {
    return this.collectionState;
  }

  /** Current optional identity value. */
  get value(): string | undefined {
    return this._value;
  }

  /** Subscribes to Toggle state changes. */
  subscribe(listener: ToggleStateListener): () => void {
    this.listeners.add(listener);
    this.ensureGroupSubscription();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.unsubscribeGroup?.();
        this.unsubscribeGroup = undefined;
      }
    };
  }

  /** Attaches the Store to its one live Toggle Renderable. */
  attach(options: {
    focus: () => void;
    isAvailable: () => boolean;
  }): () => void {
    if (!this.group) return () => {};
    if (this.registration) throw new Error("Toggle Store is already attached");
    const value = this._value;
    if (value === undefined)
      throw new Error("A Toggle inside ToggleGroup requires a value");
    const registration = this.group.registerItem(value, {
      disabled: this._disabled,
      focus: options.focus,
      isAvailable: options.isAvailable,
    });
    this.registration = registration;
    this.refreshFromGroup();
    return () => {
      if (this.registration !== registration) return;
      registration.unregister();
      this.registration = undefined;
      this.collectionState = undefined;
      this.publish();
    };
  }

  /** Requests the inverse pressed state through the active ownership model. */
  requestToggle(details: ToggleChangeDetails): void {
    if (this.snapshot.disabled) return;
    const pressed = !this.snapshot.pressed;
    const immutableDetails = Object.freeze({ ...details });
    if (this.group) {
      const key = this.registration?.key;
      if (!key) return;
      this.group.requestToggle(key, pressed, immutableDetails, () => {
        this.onPressedChangeCallback?.(pressed, immutableDetails);
      });
      return;
    }
    if (!this.controlled) {
      this._pressed = pressed;
      this.publish();
    }
    this.onPressedChangeCallback?.(pressed, immutableDetails);
  }

  /** Applies a controlled pressed value, or releases control when undefined. */
  setPressed(pressed: boolean | null | undefined): void {
    if (this.group) return;
    if (typeof pressed !== "boolean") {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this._pressed = pressed;
    this.publish();
  }

  /** Updates local disablement. */
  setDisabled(disabled: boolean): void {
    this._disabled = disabled;
    this.registration?.setDisabled(disabled);
    this.publish();
  }

  /** Updates actual Renderable focus state. */
  setFocused(focused: boolean): void {
    if (this.snapshot.disabled && focused) return;
    this.registration?.setActive(focused);
    this.publish(focused);
  }

  /** Updates the value used when this Toggle belongs to a group. */
  setValue(value: string | undefined): void {
    if (!this.group) {
      this._value = value;
      return;
    }
    if (value === undefined)
      throw new Error("A Toggle inside ToggleGroup requires a value");
    this._value = value;
    this.registration?.setValue(value);
    this.refreshFromGroup();
  }

  /** Replaces the pressed-change callback. */
  setOnPressedChange(callback: TogglePressedChangeHandler | undefined): void {
    this.onPressedChangeCallback = callback;
  }

  /** Re-evaluates whether this mounted group item is available. */
  refreshAvailability(): void {
    this.registration?.refreshAvailability();
    this.refreshFromGroup();
  }

  private ensureGroupSubscription(): void {
    if (!this.group || this.unsubscribeGroup) return;
    this.unsubscribeGroup = this.group.subscribe(() => this.refreshFromGroup());
  }

  private refreshFromGroup(): void {
    const key = this.registration?.key;
    this.collectionState = key ? this.group?.getItemState(key) : undefined;
    this.publish();
  }

  private createState(focused: boolean): ToggleState {
    const groupPressed =
      this.group && this._value !== undefined
        ? this.group.state.value.includes(this._value)
        : undefined;
    const disabled =
      this.collectionState?.disabled ??
      (this.group?.state.disabled || this._disabled);
    return {
      disabled,
      focused: disabled ? false : focused,
      pressed: this.collectionState?.pressed ?? groupPressed ?? this._pressed,
      tabbable: disabled
        ? false
        : this.group
          ? (this.collectionState?.tabbable ?? false)
          : true,
    };
  }

  private publish(focused = this.snapshot.focused): void {
    const state = this.createState(focused);
    if (
      state.disabled === this.snapshot.disabled &&
      state.focused === this.snapshot.focused &&
      state.pressed === this.snapshot.pressed &&
      state.tabbable === this.snapshot.tabbable
    )
      return;
    this.snapshot = Object.freeze(state);
    for (const listener of [...this.listeners]) listener(this.snapshot);
  }
}

/** Native OpenTUI options plus Toggle behavior props. */
export interface ToggleOptions extends BoxOptions, ToggleStoreOptions {
  store?: ToggleStore;
}

/** Focusable two-state Toggle Renderable. */
export class ToggleRenderable extends PressableRenderable {
  private readonly toggleStore: ToggleStore;
  private readonly detach: () => void;

  /** Creates a Toggle Renderable. */
  constructor(ctx: RenderContext, options: ToggleOptions = {}) {
    const {
      defaultPressed,
      disabled,
      group,
      onPressedChange,
      pressed,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this.toggleStore =
      store ??
      new ToggleStore({
        defaultPressed,
        disabled,
        group,
        onPressedChange,
        pressed,
        value,
      });
    if (store) {
      if (pressed !== undefined) store.setPressed(pressed);
      if (disabled !== undefined) store.setDisabled(disabled);
      if (value !== undefined) store.setValue(value);
      if (onPressedChange !== undefined)
        store.setOnPressedChange(onPressedChange);
    }
    this.detach = this.toggleStore.attach({
      focus: () => this.focus(),
      isAvailable: () => this.isAvailable(),
    });
    this.attachPressable(this.toggleStore);
  }

  /** Grouped Toggles stay focusable only while they own the roving tab stop. */
  protected override pressableFocusable(): boolean {
    return this.canFocus();
  }

  /** Requests a Toggle activation for one semantic press. */
  protected handlePress(details: PressDetails): void {
    this.activate(details);
  }

  /** Store owned by this Toggle. */
  get store(): ToggleStore {
    return this.toggleStore;
  }

  /** Prevents replacement of a mounted Toggle Store. */
  set store(store: ToggleStore) {
    if (store !== this.toggleStore)
      throw new Error("Toggle store cannot be replaced");
  }

  /** Optional ToggleGroup owner. */
  get group(): ToggleGroupStore | undefined {
    return this.toggleStore.group;
  }

  /** Group registration key when this Toggle belongs to a group. */
  get groupKey(): ToggleGroupItemKey | undefined {
    return this.toggleStore.groupKey;
  }

  /** Current immutable Toggle state. */
  getState(): ToggleState {
    return this.toggleStore.state;
  }

  /** Subscribes to Toggle state changes. */
  subscribe(listener: ToggleStateListener): () => void {
    return this.toggleStore.subscribe(listener);
  }

  /** Handles grouped roving-focus keys outside the shared activation map. */
  protected override handleUnclaimedKey(key: KeyEvent): boolean {
    if (!this.group) return false;
    const orientation = this.group.state.orientation;
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

  /** Focuses this Toggle when it is eligible. */
  override focus(): void {
    if (this.toggleStore.state.disabled || !this.refreshCollection()) return;
    this._focusable = true;
    super.focus();
  }

  /** Current pressed state. */
  get pressed(): boolean {
    return this.toggleStore.state.pressed;
  }

  set pressed(pressed: boolean | null | undefined) {
    this.toggleStore.setPressed(pressed);
  }

  /** Current disabled state. */
  get disabled(): boolean {
    return this.toggleStore.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this.toggleStore.setDisabled(disabled ?? false);
  }

  /** Group identity value. */
  get value(): string | undefined {
    return this.toggleStore.value;
  }

  set value(value: string | undefined) {
    this.toggleStore.setValue(value);
  }

  /** Replaces the pressed-change callback. */
  set onPressedChange(callback: TogglePressedChangeHandler | undefined) {
    this.toggleStore.setOnPressedChange(callback);
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean) {
    if (super.visible === visible) return;
    const key = this.groupKey;
    const fallback =
      !visible && this._focused && key
        ? this.group?.getFallbackTarget(key)
        : undefined;
    super.visible = visible;
    this.toggleStore.refreshAvailability();
    this._focusable = this.canFocus();
    fallback?.focus();
  }

  /** Releases Store and group registration ownership. */
  override destroy(): void {
    this.detachPressable();
    this.detach();
    super.destroy();
    this.toggleStore.setFocused(false);
  }

  private moveFocus(direction: ToggleGroupFocusDirection): boolean {
    const key = this.groupKey;
    if (!this.group || !key) return false;
    const target = this.group.getNavigationTarget(key, direction);
    if (!target) return false;
    target.focus();
    return true;
  }

  private activate(details: PressDetails): void {
    if (this._isDestroyed) return;
    if (this.group && !this.refreshCollection()) return;
    this.toggleStore.requestToggle(details);
  }

  private canFocus(): boolean {
    const state = this.toggleStore.state;
    if (state.disabled) return false;
    return state.tabbable || this._focused;
  }

  private isAvailable(): boolean {
    if (this._isDestroyed || !this.visible) return false;
    if (!this.group) return this.parent !== null;
    let ancestor = this.parent;
    while (ancestor) {
      if (!ancestor.visible) return false;
      if (
        ancestor instanceof ToggleGroupRenderable &&
        ancestor.store === this.group
      )
        return ancestor.parent !== null;
      ancestor = ancestor.parent;
    }
    return false;
  }

  private refreshCollection(): boolean {
    if (!this.group) return this.isAvailable();
    let ancestor = this.parent;
    while (ancestor) {
      if (
        ancestor instanceof ToggleGroupRenderable &&
        ancestor.store === this.group
      ) {
        ancestor.refreshItems();
        this.toggleStore.refreshAvailability();
        return this.isAvailable();
      }
      ancestor = ancestor.parent;
    }
    return false;
  }
}
