import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import {
  type CheckboxGroupFocusDirection,
  type CheckboxGroupItemKey,
  type CheckboxGroupItemRegistration,
  type CheckboxGroupItemState,
  CheckboxGroupRenderable,
  type CheckboxGroupStore,
} from "../checkbox-group/primitive";
import { PressableRenderable, type PressDetails } from "../internal/pressable";

/** Gesture details for one semantic Checkbox press. */
export type CheckboxChangeDetails = PressDetails;

/** Readonly observable Checkbox state. */
export interface CheckboxState {
  /** Whether this Checkbox is checked. */
  readonly checked: boolean;
  /** Whether Root or group disablement blocks interaction. */
  readonly disabled: boolean;
  /** Whether this Root owns actual OpenTUI focus. */
  readonly focused: boolean;
  /** Whether this Root is the current group tab stop. */
  readonly tabbable: boolean;
}

/** Callback invoked when a Checkbox requests a checked-state change. */
export type CheckboxCheckedChangeHandler = (
  checked: boolean,
  details: CheckboxChangeDetails,
) => void;

/** Options used to construct a Checkbox Store. */
export interface CheckboxStoreOptions {
  /** Controlled standalone checked state. */
  readonly checked?: boolean;
  /** Initial standalone checked state when uncontrolled. */
  readonly defaultChecked?: boolean;
  /** Local Checkbox disablement. */
  readonly disabled?: boolean;
  /** Optional CheckboxGroup owner for Core composition. */
  readonly group?: CheckboxGroupStore;
  /** Callback for one accepted checked-state request. */
  readonly onCheckedChange?: CheckboxCheckedChangeHandler;
  /** Required unique identity when group is provided. */
  readonly value?: string;
}

type CheckboxStateListener = (state: CheckboxState) => void;

const IMPERATIVE_DETAILS: CheckboxChangeDetails = Object.freeze({
  source: "imperative",
});

/** Framework-neutral owner for standalone or grouped Checkbox state. */
export class CheckboxStore {
  private controlled: boolean;
  private snapshot: CheckboxState;
  private _disabled: boolean;
  private _checked: boolean;
  private _value?: string;
  private onCheckedChangeCallback?: CheckboxCheckedChangeHandler;
  private registration?: CheckboxGroupItemRegistration;
  private collectionState?: CheckboxGroupItemState;
  private readonly listeners = new Set<CheckboxStateListener>();
  private unsubscribeGroup?: () => void;

  /** Creates a Checkbox Store. */
  constructor(options: CheckboxStoreOptions = {}) {
    if (options.group && options.value === undefined) {
      throw new Error("A Checkbox inside CheckboxGroup requires a value");
    }
    this.controlled = !options.group && options.checked !== undefined;
    this._disabled = options.disabled ?? false;
    this._checked = options.checked ?? options.defaultChecked ?? false;
    this._value = options.value;
    this.group = options.group;
    this.onCheckedChangeCallback = options.onCheckedChange;
    const groupChecked =
      this.group && this._value !== undefined
        ? this.group.state.value.includes(this._value)
        : undefined;
    const disabled = this.group?.state.disabled || this._disabled;
    this.snapshot = Object.freeze({
      checked: groupChecked ?? this._checked,
      disabled,
      focused: false,
      tabbable: !this.group && !disabled,
    });
  }

  /** Optional CheckboxGroup owner. */
  readonly group?: CheckboxGroupStore;

  /** Current immutable Checkbox state. */
  get state(): CheckboxState {
    return this.snapshot;
  }

  /** Current group registration key, when mounted in a CheckboxGroup. */
  get groupKey(): CheckboxGroupItemKey | undefined {
    return this.registration?.key;
  }

  /** Current group collection state, when mounted in a CheckboxGroup. */
  get groupState(): CheckboxGroupItemState | undefined {
    return this.collectionState;
  }

  /** Current optional identity value. */
  get value(): string | undefined {
    return this._value;
  }

  /** Subscribes to Checkbox state changes. */
  subscribe(listener: CheckboxStateListener): () => void {
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

  /** Attaches the Store to its one live Checkbox Renderable. */
  attach(options: {
    focus: () => void;
    isAvailable: () => boolean;
  }): () => void {
    if (!this.group) return () => {};
    if (this.registration)
      throw new Error("Checkbox Store is already attached");
    const value = this._value;
    if (value === undefined)
      throw new Error("A Checkbox inside CheckboxGroup requires a value");
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

  /** Requests the inverse checked state through the active ownership model. */
  requestToggle(details: CheckboxChangeDetails = IMPERATIVE_DETAILS): void {
    if (this.snapshot.disabled) return;
    const checked = !this.snapshot.checked;
    const immutableDetails = Object.freeze({ ...details });
    if (this.group) {
      const key = this.registration?.key;
      if (!key) return;
      this.group.requestToggle(key, checked, immutableDetails, () => {
        this.onCheckedChangeCallback?.(checked, immutableDetails);
      });
      return;
    }
    if (!this.controlled) {
      this._checked = checked;
      this.publish();
    }
    this.onCheckedChangeCallback?.(checked, immutableDetails);
  }

  /** Applies a controlled checked value, or releases control when undefined. */
  setChecked(checked: boolean | null | undefined): void {
    if (this.group) return;
    if (typeof checked !== "boolean") {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this._checked = checked;
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

  /** Updates the value used when this Checkbox belongs to a group. */
  setValue(value: string | undefined): void {
    if (!this.group) {
      this._value = value;
      return;
    }
    if (value === undefined)
      throw new Error("A Checkbox inside CheckboxGroup requires a value");
    this._value = value;
    this.registration?.setValue(value);
    this.refreshFromGroup();
  }

  /** Replaces the checked-change callback. */
  setOnCheckedChange(callback: CheckboxCheckedChangeHandler | undefined): void {
    this.onCheckedChangeCallback = callback;
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

  private createState(focused: boolean): CheckboxState {
    const groupChecked =
      this.group && this._value !== undefined
        ? this.group.state.value.includes(this._value)
        : undefined;
    const disabled =
      this.collectionState?.disabled ??
      (this.group?.state.disabled || this._disabled);
    return {
      checked: this.collectionState?.checked ?? groupChecked ?? this._checked,
      disabled,
      focused: disabled ? false : focused,
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
      state.checked === this.snapshot.checked &&
      state.tabbable === this.snapshot.tabbable
    )
      return;
    this.snapshot = Object.freeze(state);
    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) listener(this.snapshot);
    }
  }
}

/** Native OpenTUI options plus Checkbox behavior props. */
export interface CheckboxRootOptions extends BoxOptions, CheckboxStoreOptions {
  /** Existing Store for imperative composition. */
  store?: CheckboxStore;
}

/** Focusable two-state Checkbox Renderable. */
export class CheckboxRootRenderable extends PressableRenderable {
  private readonly _store: CheckboxStore;
  private readonly detach: () => void;
  private coordinationReleased = false;

  /** Creates a Checkbox Renderable. */
  constructor(ctx: RenderContext, options: CheckboxRootOptions = {}) {
    const {
      defaultChecked,
      disabled,
      group,
      onCheckedChange,
      checked,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._store =
      store ??
      new CheckboxStore({
        defaultChecked,
        disabled,
        group,
        onCheckedChange,
        checked,
        value,
      });
    if (store) {
      if (checked !== undefined) store.setChecked(checked);
      if (disabled !== undefined) store.setDisabled(disabled);
      if (value !== undefined) store.setValue(value);
      if (onCheckedChange !== undefined)
        store.setOnCheckedChange(onCheckedChange);
    }
    this.detach = this._store.attach({
      focus: () => this.focus(),
      isAvailable: () => this.isAvailable(),
    });
    this.attachPressable(this._store);
  }

  /** Grouped Checkboxes stay focusable only while they own the roving tab stop. */
  protected override pressableFocusable(): boolean {
    return this.canFocus();
  }

  /** Requests a Checkbox activation for one semantic press. */
  protected handlePress(details: PressDetails): void {
    this.activate(details);
  }

  /** Store owned by this Checkbox. */
  get store(): CheckboxStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Checkbox Store. */
  set store(store: CheckboxStore) {
    if (store !== this._store)
      throw new Error("Checkbox.Root store cannot be replaced");
  }

  /** Optional CheckboxGroup owner. */
  get group(): CheckboxGroupStore | undefined {
    return this._store.group;
  }

  /** Group registration key when this Checkbox belongs to a group. */
  get groupKey(): CheckboxGroupItemKey | undefined {
    return this._store.groupKey;
  }

  /** Current immutable Checkbox state. */
  getState(): CheckboxState {
    return this._store.state;
  }

  /** Subscribes to Checkbox state changes. */
  subscribe(listener: CheckboxStateListener): () => void {
    return this._store.subscribe(listener);
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

  /** Focuses this Checkbox when it is eligible. */
  override focus(): void {
    if (this._store.state.disabled || !this.refreshCollection()) return;
    this._focusable = true;
    super.focus();
  }

  /** Current checked state. */
  get checked(): boolean {
    return this._store.state.checked;
  }

  set checked(checked: boolean | null | undefined) {
    this._store.setChecked(checked);
  }

  /** Current disabled state. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  /** Group identity value. */
  get value(): string | undefined {
    return this._store.value;
  }

  set value(value: string | undefined) {
    this._store.setValue(value);
  }

  /** Replaces the checked-change callback. */
  set onCheckedChange(callback: CheckboxCheckedChangeHandler | undefined) {
    this._store.setOnCheckedChange(callback);
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
    this._store.refreshAvailability();
    this._focusable = this.canFocus();
    fallback?.focus();
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases Store and group registration ownership. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently ends interaction and optional group coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          child instanceof CheckboxIndicatorRenderable &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime();
        } else {
          visit(child);
        }
      }
    };
    visit(this);
    this.detachPressable();
    this.detach();
    this._focusable = false;
    if (this._focused) super.blur();
    this._store.setFocused(false);
  }

  private moveFocus(direction: CheckboxGroupFocusDirection): boolean {
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
    this._store.requestToggle(details);
  }

  private canFocus(): boolean {
    const state = this._store.state;
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
        ancestor instanceof CheckboxGroupRenderable &&
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
        ancestor instanceof CheckboxGroupRenderable &&
        ancestor.store === this.group
      ) {
        ancestor.refreshItems();
        this._store.refreshAvailability();
        return this.isAvailable();
      }
      ancestor = ancestor.parent;
    }
    return false;
  }
}

/** Native OpenTUI options for a Checkbox Indicator. */
export interface CheckboxIndicatorOptions extends BoxOptions {
  /** Store owned by the matching Checkbox Root. */
  store: CheckboxStore;
}

/** Passive Part whose visibility reflects the owning Checkbox state. */
export class CheckboxIndicatorRenderable extends BoxRenderable {
  private _store: CheckboxStore;
  private _unsubscribe: () => void;
  private coordinationReleased = false;

  /** Creates a Checkbox Indicator Renderable. */
  constructor(ctx: RenderContext, options: CheckboxIndicatorOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: store.state.checked });
    this._store = store;
    this._unsubscribe = store.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  /** Current immutable Checkbox state. */
  getState(): CheckboxState {
    return this._store.state;
  }

  /** Store associated with this Indicator. */
  get store(): CheckboxStore {
    return this._store;
  }

  set store(store: CheckboxStore) {
    if (this.coordinationReleased || this._store === store) return;
    this._unsubscribe();
    this._store = store;
    this.visible = store.state.checked;
    this._unsubscribe = store.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases the Store subscription. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently releases Checkbox state coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this._unsubscribe();
  }
}
