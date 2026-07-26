import type { BaseRenderable, BoxOptions, RenderContext } from "@opentui/core";
import { CheckboxRootRenderable } from "../checkbox/primitive";
import type { PressDetails } from "../internal/pressable";
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

// These public aliases deliberately insulate API vocabulary from the internal
// roving-collection vocabulary, so internal names never leak into declarations.
/** Stable identity for a Checkbox registered with a CheckboxGroup. */
export type CheckboxGroupItemKey = CollectionItemKey;

/** Direction used by CheckboxGroup roving-focus navigation. */
export type CheckboxGroupFocusDirection = CollectionFocusDirection;

/** Terminal layout direction used by CheckboxGroup keyboard navigation. */
export type CheckboxGroupOrientation = "horizontal" | "vertical";

/** Readonly observable CheckboxGroup state. */
export interface CheckboxGroupState {
  /** Whether group interaction is disabled. */
  readonly disabled: boolean;
  /** Arrow-key axis used for rendered-order navigation. */
  readonly orientation: CheckboxGroupOrientation;
  /** Values of the currently checked Checkboxes. */
  readonly value: readonly string[];
}

/** Readonly state for one CheckboxGroup collection member. */
export interface CheckboxGroupItemState {
  /** Whether this Checkbox is a live rendered group member. */
  readonly available: boolean;
  /** Effective group or local disablement. */
  readonly disabled: boolean;
  /** Whether this Checkbox value belongs to group value. */
  readonly checked: boolean;
  /** Whether this Checkbox is the current roving tab stop. */
  readonly tabbable: boolean;
  /** Stable Checkbox identity. */
  readonly value: string;
}

/** Callback invoked when a CheckboxGroup requests a new value. */
export type CheckboxGroupValueChangeHandler = (
  value: readonly string[],
  details: PressDetails,
) => void;

/** Options used to construct a CheckboxGroup Store. */
export interface CheckboxGroupStoreOptions {
  /** Initial checked values when uncontrolled. */
  readonly defaultValue?: readonly string[];
  /** Whether group interaction is disabled. */
  readonly disabled?: boolean;
  /** Whether keyboard navigation wraps at collection edges. */
  readonly loopFocus?: boolean;
  /** Callback for one accepted checked-value request. */
  readonly onValueChange?: CheckboxGroupValueChangeHandler;
  /** Arrow-key navigation axis; defaults to vertical. */
  readonly orientation?: CheckboxGroupOrientation;
  /** Controlled checked values. */
  readonly value?: readonly string[];
}

/** Options used to register one Checkbox with a CheckboxGroup Store. */
export type CheckboxGroupItemRegistrationOptions =
  CollectionItemRegistrationOptions;

/** Retained registration for one CheckboxGroup member. */
export type CheckboxGroupItemRegistration = CollectionItemRegistration;

/** Focus target returned by CheckboxGroup collection navigation. */
export type CheckboxGroupNavigationTarget = CollectionNavigationTarget;

function normalizeValue(
  value: readonly string[] | undefined,
): readonly string[] {
  return Object.freeze([...new Set(value ?? [])]);
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

/** Framework-neutral selection and roving-focus owner for CheckboxGroup. */
export class CheckboxGroupStore extends RovingCollectionStore<
  CheckboxGroupState,
  CheckboxGroupItemState
> {
  private controlled: boolean;
  private _loopFocus: boolean;
  private rootOwner?: object;
  private onValueChangeCallback?: CheckboxGroupValueChangeHandler;

  /** Creates a CheckboxGroup Store. */
  constructor(options: CheckboxGroupStoreOptions = {}) {
    super("CheckboxGroup", {
      disabled: options.disabled ?? false,
      orientation: options.orientation ?? "vertical",
      value: normalizeValue(options.value ?? options.defaultValue),
    });
    this.controlled = options.value !== undefined;
    this._loopFocus = options.loopFocus ?? true;
    this.onValueChangeCallback = options.onValueChange;
  }

  /** Claims this Store for one live CheckboxGroup Root. */
  attachRoot(owner: object): void {
    if (this.rootOwner && this.rootOwner !== owner) {
      throw new Error(
        "CheckboxGroup Store may be adopted by only one live CheckboxGroup",
      );
    }
    this.rootOwner = owner;
  }

  /** Releases one CheckboxGroup Root's claim. */
  detachRoot(owner: object): void {
    if (this.rootOwner === owner) this.rootOwner = undefined;
  }

  /** Whether keyboard navigation wraps at the collection edges. */
  get loopFocus(): boolean {
    return this._loopFocus;
  }

  /** Requests that a registered Checkbox change its checked state. */
  requestToggle(
    key: CheckboxGroupItemKey,
    checked: boolean,
    details: PressDetails,
    onAccepted?: () => void,
  ): void {
    this.runMutation(() => {
      const item = this.items.get(key);
      if (
        !item ||
        !this.isItemAvailable(item) ||
        item.state.checked === checked
      )
        return;
      const value = normalizeValue(
        checked
          ? [...this.state.value, item.value]
          : this.state.value.filter((value) => value !== item.value),
      );
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
      this.update({ value: normalizeValue(value) });
    });
  }

  /** Updates group disablement. */
  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) this.activeKey = null;
      this.update({ disabled });
    });
  }

  /** Updates the keyboard-navigation orientation. */
  setOrientation(orientation: CheckboxGroupOrientation): void {
    this.runMutation(() => this.update({ orientation }));
  }

  /** Updates whether keyboard navigation wraps. */
  setLoopFocus(loopFocus: boolean): void {
    this._loopFocus = loopFocus;
  }

  /** Replaces the value-change callback. */
  setOnValueChange(
    callback: CheckboxGroupValueChangeHandler | undefined,
  ): void {
    this.onValueChangeCallback = callback;
  }

  protected createItemState(
    key: CheckboxGroupItemKey,
    item: CollectionItemInput,
  ): CheckboxGroupItemState {
    return Object.freeze({
      available: this.collectionAvailable && (item.isAvailable?.() ?? true),
      disabled: this.state.disabled || item.disabled,
      checked: this.state.value.includes(item.value),
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
    this.update({ value: normalizeValue(nextValue) });
    return true;
  }

  protected override update(next: Partial<CheckboxGroupState>): void {
    const nextValue = next.value;
    const value =
      nextValue && valuesEqual(nextValue, this.state.value)
        ? this.state.value
        : nextValue;
    super.update(value ? { ...next, value } : next);
  }
}

/** Native OpenTUI options plus CheckboxGroup behavior props. */
export interface CheckboxGroupOptions
  extends BoxOptions,
    CheckboxGroupStoreOptions {
  /** Existing Store for imperative composition. */
  store?: CheckboxGroupStore;
}

/** Non-focusable Renderable that owns one CheckboxGroup collection. */
export class CheckboxGroupRenderable extends RovingCollectionRenderable<
  CheckboxGroupState,
  CheckboxGroupItemState
> {
  private readonly _store: CheckboxGroupStore;
  private readonly storeOwner: object;
  private coordinationReleased = false;

  /** Creates a CheckboxGroup Renderable. */
  constructor(ctx: RenderContext, options: CheckboxGroupOptions = {}) {
    const {
      defaultValue,
      disabled,
      loopFocus,
      onValueChange,
      orientation,
      store,
      value,
      ...boxOptions
    } = options;
    const groupStore =
      store ??
      new CheckboxGroupStore({
        defaultValue,
        disabled,
        loopFocus,
        onValueChange,
        orientation,
        value,
      });
    const storeOwner = {};
    groupStore.attachRoot(storeOwner);
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (orientation !== undefined) store.setOrientation(orientation);
      if (loopFocus !== undefined) store.setLoopFocus(loopFocus);
      if (value !== undefined) store.setValue(value);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
    }
    super(ctx, boxOptions, groupStore);
    this._store = groupStore;
    this.storeOwner = storeOwner;
  }

  /** Store owned by this group. */
  get store(): CheckboxGroupStore {
    return this._store;
  }

  /** Prevents replacement of a mounted group Store. */
  set store(store: CheckboxGroupStore) {
    if (store !== this._store)
      throw new Error("CheckboxGroup store cannot be replaced");
  }

  /** Current immutable group state. */
  getState(): CheckboxGroupState {
    return this._store.state;
  }

  /** Current checked Checkbox values. */
  get value(): readonly string[] {
    return this._store.state.value;
  }

  set value(value: readonly string[] | undefined) {
    this._store.setValue(value);
  }

  /** Whether the entire group is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  /** Keyboard-navigation orientation. */
  get orientation(): CheckboxGroupOrientation {
    return this._store.state.orientation;
  }

  set orientation(orientation: CheckboxGroupOrientation | null | undefined) {
    this._store.setOrientation(orientation ?? "vertical");
  }

  /** Whether keyboard navigation wraps at collection edges. */
  get loopFocus(): boolean {
    return this._store.loopFocus;
  }

  set loopFocus(loopFocus: boolean | null | undefined) {
    this._store.setLoopFocus(loopFocus ?? true);
  }

  /** Replaces the value-change callback. */
  set onValueChange(callback: CheckboxGroupValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently ends this group and descendant Checkbox coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently releases every grouped descendant and collection owner. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          child instanceof CheckboxRootRenderable &&
          child.group === this._store
        ) {
          child.endCoordinationLifetime();
        } else {
          visit(child);
        }
      }
    };
    visit(this);
    this._store.setCollectionAvailable(false);
    this.releaseCollectionOwnership();
    this._store.detachRoot(this.storeOwner);
  }

  protected itemKeyFor(
    child: BaseRenderable,
  ): CheckboxGroupItemKey | null | undefined {
    return child instanceof CheckboxRootRenderable &&
      child.group === this._store
      ? (child.groupKey ?? null)
      : undefined;
  }
}
