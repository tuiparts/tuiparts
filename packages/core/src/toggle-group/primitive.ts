import type { BaseRenderable, BoxOptions, RenderContext } from "@opentui/core";
import {
  type CollectionFocusDirection,
  type CollectionItemInput,
  type CollectionItemKey,
  type CollectionItemRegistration,
  type CollectionItemRegistrationOptions,
  type CollectionNavigationTarget,
  RovingCollectionRenderable,
  RovingCollectionStore,
} from "../internal/roving-collection";
import type { ToggleChangeDetails } from "../internal/toggle-change-details";
import { ToggleRenderable } from "../toggle/primitive";

/** Stable identity for a Toggle registered with a ToggleGroup. */
export type ToggleGroupItemKey = CollectionItemKey;

/** Direction used by ToggleGroup roving-focus navigation. */
export type ToggleGroupFocusDirection = CollectionFocusDirection;

/** Terminal layout direction used by ToggleGroup keyboard navigation. */
export type ToggleGroupOrientation = "horizontal" | "vertical";

/** Readonly observable ToggleGroup state. */
export interface ToggleGroupState {
  readonly disabled: boolean;
  readonly multiple: boolean;
  readonly orientation: ToggleGroupOrientation;
  readonly value: readonly string[];
}

/** Readonly state for one ToggleGroup collection member. */
export interface ToggleGroupItemState {
  readonly available: boolean;
  readonly disabled: boolean;
  readonly pressed: boolean;
  readonly tabbable: boolean;
  readonly value: string;
}

/** Callback invoked when a ToggleGroup requests a new value. */
export type ToggleGroupValueChangeHandler = (
  value: readonly string[],
  details: ToggleChangeDetails,
) => void;

/** Options used to construct a ToggleGroup Store. */
export interface ToggleGroupStoreOptions {
  readonly defaultValue?: readonly string[];
  readonly disabled?: boolean;
  readonly loopFocus?: boolean;
  readonly multiple?: boolean;
  readonly onValueChange?: ToggleGroupValueChangeHandler;
  readonly orientation?: ToggleGroupOrientation;
  readonly value?: readonly string[];
}

/** Options used to register one Toggle with a ToggleGroup Store. */
export type ToggleGroupItemRegistrationOptions =
  CollectionItemRegistrationOptions;

/** Retained registration for one ToggleGroup member. */
export type ToggleGroupItemRegistration = CollectionItemRegistration;

/** Focus target returned by ToggleGroup collection navigation. */
export type ToggleGroupNavigationTarget = CollectionNavigationTarget;

function normalizeValue(
  value: readonly string[] | undefined,
  multiple: boolean,
): readonly string[] {
  const unique = [...new Set(value ?? [])];
  return Object.freeze(multiple ? unique : unique.slice(0, 1));
}

function valuesEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

/** Framework-neutral selection and roving-focus owner for ToggleGroup. */
export class ToggleGroupStore extends RovingCollectionStore<
  ToggleGroupState,
  ToggleGroupItemState
> {
  private controlled: boolean;
  private _loopFocus: boolean;
  private onValueChangeCallback?: ToggleGroupValueChangeHandler;

  /** Creates a ToggleGroup Store. */
  constructor(options: ToggleGroupStoreOptions = {}) {
    const multiple = options.multiple ?? false;
    super("ToggleGroup", {
      disabled: options.disabled ?? false,
      multiple,
      orientation: options.orientation ?? "horizontal",
      value: normalizeValue(options.value ?? options.defaultValue, multiple),
    });
    this.controlled = options.value !== undefined;
    this._loopFocus = options.loopFocus ?? true;
    this.onValueChangeCallback = options.onValueChange;
  }

  /** Whether keyboard navigation wraps at the collection edges. */
  get loopFocus(): boolean {
    return this._loopFocus;
  }

  /** Requests that a registered Toggle change its pressed state. */
  requestToggle(
    key: ToggleGroupItemKey,
    pressed: boolean,
    details: ToggleChangeDetails,
    onAccepted?: () => void,
  ): void {
    this.runMutation(() => {
      const item = this.items.get(key);
      if (
        !item ||
        !this.isItemAvailable(item) ||
        item.state.pressed === pressed
      )
        return;
      const nextValue = this.state.multiple
        ? pressed
          ? [...this.state.value, item.value]
          : this.state.value.filter((value) => value !== item.value)
        : pressed
          ? [item.value]
          : [];
      const value = normalizeValue(nextValue, this.state.multiple);
      if (!this.controlled) this.update({ value });
      const immutableDetails = Object.isFrozen(details)
        ? details
        : Object.freeze({ ...details });
      onAccepted?.();
      this.onValueChangeCallback?.(value, immutableDetails);
    });
  }

  /** Applies a controlled value, or releases control when undefined. */
  setValue(value: readonly string[] | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this.controlled = false;
        return;
      }
      this.controlled = true;
      this.update({ value: normalizeValue(value, this.state.multiple) });
    });
  }

  /** Updates group disablement. */
  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) this.activeKey = null;
      this.update({ disabled });
    });
  }

  /** Updates whether multiple Toggles may be pressed. */
  setMultiple(multiple: boolean): void {
    this.runMutation(() => {
      this.update({
        multiple,
        value: normalizeValue(this.state.value, multiple),
      });
    });
  }

  /** Updates the keyboard-navigation orientation. */
  setOrientation(orientation: ToggleGroupOrientation): void {
    this.runMutation(() => this.update({ orientation }));
  }

  /** Updates whether keyboard navigation wraps. */
  setLoopFocus(loopFocus: boolean): void {
    this._loopFocus = loopFocus;
  }

  /** Replaces the value-change callback. */
  setOnValueChange(callback: ToggleGroupValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  protected createItemState(
    key: ToggleGroupItemKey,
    item: CollectionItemInput,
  ): ToggleGroupItemState {
    return Object.freeze({
      available: this.collectionAvailable && (item.isAvailable?.() ?? true),
      disabled: this.state.disabled || item.disabled,
      pressed: this.state.value.includes(item.value),
      tabbable: key === this.tabStopKey,
      value: item.value,
    });
  }

  protected override navigationWraps(): boolean {
    return this._loopFocus;
  }

  protected override onItemValueRenamed(
    previous: string,
    next: string,
  ): boolean {
    if (this.controlled || !this.state.value.includes(previous)) return false;
    const nextValue = this.state.value.map((entry) =>
      entry === previous ? next : entry,
    );
    this.update({ value: normalizeValue(nextValue, this.state.multiple) });
    return true;
  }

  protected override update(next: Partial<ToggleGroupState>): void {
    const nextValue = next.value;
    const value =
      nextValue && valuesEqual(nextValue, this.state.value)
        ? this.state.value
        : nextValue;
    super.update(value ? { ...next, value } : next);
  }
}

/** Native OpenTUI options plus ToggleGroup behavior props. */
export interface ToggleGroupOptions
  extends BoxOptions,
    ToggleGroupStoreOptions {
  store?: ToggleGroupStore;
}

/** Non-focusable Renderable that owns one ToggleGroup collection. */
export class ToggleGroupRenderable extends RovingCollectionRenderable<
  ToggleGroupState,
  ToggleGroupItemState
> {
  private readonly groupStore: ToggleGroupStore;

  /** Creates a ToggleGroup Renderable. */
  constructor(ctx: RenderContext, options: ToggleGroupOptions = {}) {
    const {
      defaultValue,
      disabled,
      loopFocus,
      multiple,
      onValueChange,
      orientation,
      store,
      value,
      ...boxOptions
    } = options;
    const groupStore =
      store ??
      new ToggleGroupStore({
        defaultValue,
        disabled,
        loopFocus,
        multiple,
        onValueChange,
        orientation,
        value,
      });
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (multiple !== undefined) store.setMultiple(multiple);
      if (orientation !== undefined) store.setOrientation(orientation);
      if (loopFocus !== undefined) store.setLoopFocus(loopFocus);
      if (value !== undefined) store.setValue(value);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
    }
    super(ctx, boxOptions, groupStore);
    this.groupStore = groupStore;
  }

  /** Store owned by this group. */
  get store(): ToggleGroupStore {
    return this.groupStore;
  }

  /** Prevents replacement of a mounted group Store. */
  set store(store: ToggleGroupStore) {
    if (store !== this.groupStore)
      throw new Error("ToggleGroup store cannot be replaced");
  }

  /** Current immutable group state. */
  getState(): ToggleGroupState {
    return this.groupStore.state;
  }

  /** Current pressed Toggle values. */
  get value(): readonly string[] {
    return this.groupStore.state.value;
  }

  set value(value: readonly string[] | undefined) {
    this.groupStore.setValue(value);
  }

  /** Whether the entire group is disabled. */
  get disabled(): boolean {
    return this.groupStore.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this.groupStore.setDisabled(disabled ?? false);
  }

  /** Whether multiple Toggles may be pressed. */
  get multiple(): boolean {
    return this.groupStore.state.multiple;
  }

  set multiple(multiple: boolean | null | undefined) {
    this.groupStore.setMultiple(multiple ?? false);
  }

  /** Keyboard-navigation orientation. */
  get orientation(): ToggleGroupOrientation {
    return this.groupStore.state.orientation;
  }

  set orientation(orientation: ToggleGroupOrientation | null | undefined) {
    this.groupStore.setOrientation(orientation ?? "horizontal");
  }

  /** Whether keyboard navigation wraps at collection edges. */
  get loopFocus(): boolean {
    return this.groupStore.loopFocus;
  }

  set loopFocus(loopFocus: boolean | null | undefined) {
    this.groupStore.setLoopFocus(loopFocus ?? true);
  }

  /** Replaces the value-change callback. */
  set onValueChange(callback: ToggleGroupValueChangeHandler | undefined) {
    this.groupStore.setOnValueChange(callback);
  }

  protected itemKeyFor(
    child: BaseRenderable,
  ): ToggleGroupItemKey | null | undefined {
    return child instanceof ToggleRenderable && child.group === this.groupStore
      ? (child.groupKey ?? null)
      : undefined;
  }
}
