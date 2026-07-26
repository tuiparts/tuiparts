import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";

/** Cause of one accepted Accordion value request. */
export type AccordionValueChangeDetails = PressDetails;

/** Immutable observable state for one Accordion Root. */
export interface AccordionState {
  /** Whether all Item interaction is disabled. */
  readonly disabled: boolean;
  /** Whether more than one Item may be open. */
  readonly multiple: boolean;
  /** Values of the currently open Items. */
  readonly value: readonly string[];
}

/** Immutable observable state for one Accordion Item. */
export interface AccordionItemState {
  /** Effective Root or Item disablement. */
  readonly disabled: boolean;
  /** Whether this Item's Panel is open. */
  readonly open: boolean;
  /** Stable Item identity. */
  readonly value: string;
}

/** Immutable observable state for one Accordion Trigger. */
export interface AccordionTriggerState extends AccordionItemState {
  /** Whether this Trigger owns actual OpenTUI focus. */
  readonly focused: boolean;
}

/** Immutable observable state for one Accordion Panel. */
export type AccordionPanelState = AccordionItemState;

/** Callback invoked for one accepted Accordion value request. */
export type AccordionValueChangeHandler = (
  value: readonly string[],
  details: AccordionValueChangeDetails,
) => void;

/** Callback invoked when one Item receives an accepted open request. */
export type AccordionItemOpenChangeHandler = (
  open: boolean,
  details: AccordionValueChangeDetails,
) => void;

/** Options used to construct an Accordion Store. */
export interface AccordionStoreOptions {
  /** Initial open values when uncontrolled. */
  readonly defaultValue?: readonly string[];
  /** Whether all Item interaction is disabled. */
  readonly disabled?: boolean;
  /** Whether more than one Item may be open. */
  readonly multiple?: boolean;
  /** Callback for semantic value requests. */
  readonly onValueChange?: AccordionValueChangeHandler;
  /** Controlled open values. */
  readonly value?: readonly string[];
}

type AccordionStateListener = (state: AccordionState) => void;

interface AccordionItemRecord {
  disabled: boolean;
  onOpenChange?: AccordionItemOpenChangeHandler;
  trigger?: {
    focus: () => void;
    owner: object;
  };
  value: string;
}

type AccordionFocusTarget = "first" | "last" | "next" | "previous";

const IMPERATIVE_DETAILS: AccordionValueChangeDetails = Object.freeze({
  source: "imperative",
});

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

/** Framework-neutral value and Item owner for Accordion Parts. */
export class AccordionStore {
  private controlled: boolean;
  private snapshot: AccordionState;
  private onValueChangeCallback?: AccordionValueChangeHandler;
  private rootOwner?: object;
  private readonly items = new Map<object, AccordionItemRecord>();
  private readonly listeners = new Set<AccordionStateListener>();

  /** Creates an Accordion Store. */
  constructor(options: AccordionStoreOptions = {}) {
    const multiple = options.multiple ?? false;
    this.controlled = options.value !== undefined;
    this.snapshot = Object.freeze({
      disabled: options.disabled ?? false,
      multiple,
      value: normalizeValue(options.value ?? options.defaultValue, multiple),
    });
    this.onValueChangeCallback = options.onValueChange;
  }

  /** Current immutable Root state. */
  get state(): AccordionState {
    return this.snapshot;
  }

  /** Subscribes to Root or Item state changes. */
  subscribe(listener: AccordionStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Claims this Store for one live Root coordination lifetime. */
  attachRoot(owner: object): void {
    if (this.rootOwner && this.rootOwner !== owner) {
      throw new Error(
        "Accordion Store may be adopted by only one live Accordion.Root",
      );
    }
    this.rootOwner = owner;
  }

  /** Releases one Root's claim without ending an externally owned Store. */
  detachRoot(owner: object): void {
    if (this.rootOwner === owner) this.rootOwner = undefined;
  }

  /** Registers one live Item with a unique value. */
  registerItem(
    owner: object,
    options: {
      readonly disabled?: boolean;
      readonly onOpenChange?: AccordionItemOpenChangeHandler;
      readonly value: string;
    },
  ): void {
    this.assertUniqueValue(options.value, owner);
    this.items.set(owner, {
      disabled: options.disabled ?? false,
      onOpenChange: options.onOpenChange,
      value: options.value,
    });
  }

  /** Removes one Item and optionally repairs uncontrolled open state. */
  unregisterItem(owner: object, repairValue = true): void {
    const item = this.items.get(owner);
    if (!item) return;
    this.items.delete(owner);
    if (
      repairValue &&
      !this.controlled &&
      this.snapshot.value.includes(item.value)
    ) {
      this.update({
        value: Object.freeze(
          this.snapshot.value.filter((value) => value !== item.value),
        ),
      });
    }
  }

  /** Current immutable state for one registered Item. */
  getItemState(owner: object): AccordionItemState {
    const item = this.requireItem(owner);
    return Object.freeze({
      disabled: this.snapshot.disabled || item.disabled,
      open: this.snapshot.value.includes(item.value),
      value: item.value,
    });
  }

  /** Requests that one live Item toggle its open state. */
  toggleItem(
    value: string,
    details: AccordionValueChangeDetails = IMPERATIVE_DETAILS,
  ): void {
    const entry = [...this.items].find(([, item]) => item.value === value);
    if (entry) this.requestItemToggle(entry[0], details);
  }

  /** Registers the one focusable Trigger owned by an Item. */
  registerTrigger(
    itemOwner: object,
    triggerOwner: object,
    focus: () => void,
  ): void {
    const item = this.requireItem(itemOwner);
    if (item.trigger && item.trigger.owner !== triggerOwner) {
      throw new Error("Accordion Item may own only one live Trigger");
    }
    item.trigger = { focus, owner: triggerOwner };
  }

  /** Removes one Item's Trigger registration. */
  unregisterTrigger(itemOwner: object, triggerOwner: object): void {
    const item = this.items.get(itemOwner);
    if (item?.trigger?.owner === triggerOwner) item.trigger = undefined;
  }

  /** Moves focus between available Item Triggers without changing value. */
  moveTriggerFocus(owner: object, target: AccordionFocusTarget): boolean {
    const available = [...this.items].filter(
      ([, item]) =>
        item.trigger !== undefined && !this.snapshot.disabled && !item.disabled,
    );
    if (available.length === 0) return false;
    const currentIndex = available.findIndex(
      ([itemOwner]) => itemOwner === owner,
    );
    let nextIndex: number;
    if (target === "first") nextIndex = 0;
    else if (target === "last") nextIndex = available.length - 1;
    else if (currentIndex < 0) return false;
    else nextIndex = currentIndex + (target === "next" ? 1 : -1);
    const next = available[nextIndex]?.[1].trigger;
    if (!next) return false;
    next.focus();
    return true;
  }

  /** Applies a controlled value, or releases control when undefined. */
  setValue(value: readonly string[] | undefined): void {
    if (value === undefined) {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this.update({ value: normalizeValue(value, this.snapshot.multiple) });
  }

  /** Updates Root disablement. */
  setDisabled(disabled: boolean): void {
    this.update({ disabled });
  }

  /** Updates single or multiple expansion policy. */
  setMultiple(multiple: boolean): void {
    this.update({
      multiple,
      value: normalizeValue(this.snapshot.value, multiple),
    });
  }

  /** Replaces the value-change callback. */
  setOnValueChange(callback: AccordionValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  /** Updates one Item's local disablement. */
  setItemDisabled(owner: object, disabled: boolean): void {
    const item = this.requireItem(owner);
    if (item.disabled === disabled) return;
    item.disabled = disabled;
    this.notify();
  }

  /** Replaces one Item's open-change callback. */
  setItemOnOpenChange(
    owner: object,
    callback: AccordionItemOpenChangeHandler | undefined,
  ): void {
    this.requireItem(owner).onOpenChange = callback;
  }

  /** Renames one Item and repairs uncontrolled open state. */
  setItemValue(owner: object, value: string): void {
    const item = this.requireItem(owner);
    if (item.value === value) return;
    this.assertUniqueValue(value, owner);
    const previous = item.value;
    item.value = value;
    if (!this.controlled && this.snapshot.value.includes(previous)) {
      this.update({
        value: Object.freeze(
          this.snapshot.value.map((entry) =>
            entry === previous ? value : entry,
          ),
        ),
      });
      return;
    }
    this.notify();
  }

  /** Releases Store listeners, Items, and callback ownership. */
  destroy(): void {
    this.items.clear();
    this.listeners.clear();
    this.onValueChangeCallback = undefined;
    this.rootOwner = undefined;
  }

  /** Internal semantic request from one Item or Trigger. */
  requestItemToggle(
    owner: object,
    details: AccordionValueChangeDetails = IMPERATIVE_DETAILS,
  ): void {
    const item = this.items.get(owner);
    if (!item || this.snapshot.disabled || item.disabled) return;
    const open = this.snapshot.value.includes(item.value);
    const nextOpen = !open;
    const nextValue = normalizeValue(
      nextOpen
        ? this.snapshot.multiple
          ? [...this.snapshot.value, item.value]
          : [item.value]
        : this.snapshot.value.filter((value) => value !== item.value),
      this.snapshot.multiple,
    );
    if (valuesEqual(nextValue, this.snapshot.value)) return;
    const immutableDetails = Object.isFrozen(details)
      ? details
      : Object.freeze({ ...details });
    if (!this.controlled) this.update({ value: nextValue });
    item.onOpenChange?.(nextOpen, immutableDetails);
    this.onValueChangeCallback?.(nextValue, immutableDetails);
  }

  private requireItem(owner: object): AccordionItemRecord {
    const item = this.items.get(owner);
    if (!item) throw new Error("Accordion Item is not registered");
    return item;
  }

  private assertUniqueValue(value: string, owner: object): void {
    for (const [candidateOwner, item] of this.items) {
      if (candidateOwner !== owner && item.value === value) {
        throw new Error(`Accordion Item value must be unique: ${value}`);
      }
    }
  }

  private update(next: Partial<AccordionState>): void {
    const value = next.value ?? this.snapshot.value;
    const normalized = valuesEqual(value, this.snapshot.value)
      ? this.snapshot.value
      : value;
    const state = { ...this.snapshot, ...next, value: normalized };
    if (
      state.disabled === this.snapshot.disabled &&
      state.multiple === this.snapshot.multiple &&
      state.value === this.snapshot.value
    ) {
      return;
    }
    this.snapshot = Object.freeze(state);
    this.notify();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) listener(this.snapshot);
    }
  }
}

/** Native OpenTUI options plus Accordion Root behavior props. */
export interface AccordionRootOptions
  extends BoxOptions,
    AccordionStoreOptions {
  /** Existing Store for imperative composition. */
  store?: AccordionStore;
}

/** Non-focusable ownership boundary for one Accordion. */
export class AccordionRootRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: AccordionStore;
  private readonly ownsStore: boolean;
  private readonly unsubscribe: () => void;
  private ownershipReleased = false;

  /** Creates an Accordion Root Renderable. */
  constructor(ctx: RenderContext, options: AccordionRootOptions = {}) {
    const {
      defaultValue,
      disabled,
      multiple,
      onValueChange,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this.ownsStore = !store;
    this._store =
      store ??
      new AccordionStore({
        defaultValue,
        disabled,
        multiple,
        onValueChange,
        value,
      });
    this._store.attachRoot(this);
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (multiple !== undefined) store.setMultiple(multiple);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
      if (value !== undefined) store.setValue(value);
    }
    this.unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  /** Store owned or adopted by this Root. */
  get store(): AccordionStore {
    return this._store;
  }

  set store(store: AccordionStore) {
    if (store !== this._store) {
      throw new Error("Accordion.Root store cannot be replaced");
    }
  }

  /** Current immutable Root state. */
  getState(): AccordionState {
    return this._store.state;
  }

  /** Current open values. */
  get value(): readonly string[] {
    return this._store.state.value;
  }

  set value(value: readonly string[] | null | undefined) {
    if (!this.ownershipReleased) this._store.setValue(value ?? undefined);
  }

  /** Whether all Item interaction is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    if (!this.ownershipReleased) this._store.setDisabled(disabled ?? false);
  }

  /** Whether more than one Item may be open. */
  get multiple(): boolean {
    return this._store.state.multiple;
  }

  set multiple(multiple: boolean | null | undefined) {
    if (!this.ownershipReleased) this._store.setMultiple(multiple ?? false);
  }

  /** Replaces the value-change callback. */
  set onValueChange(callback: AccordionValueChangeHandler | undefined) {
    if (!this.ownershipReleased) this._store.setOnValueChange(callback);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases Root ownership and subscriptions. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently ends this Root and every descendant Item lifetime. */
  endCoordinationLifetime(): void {
    if (this.ownershipReleased) return;
    this.ownershipReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          child instanceof AccordionItemRenderable &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime({ preserveValue: true });
        } else {
          visit(child);
        }
      }
    };
    visit(this);
    this.unsubscribe();
    this._store.detachRoot(this);
    if (this.ownsStore) this._store.destroy();
  }
}

/** Native OpenTUI options plus one Accordion Item registration. */
export interface AccordionItemOptions extends BoxOptions {
  /** Whether this Item is disabled. */
  disabled?: boolean;
  /** Callback for this Item's accepted open requests. */
  onOpenChange?: AccordionItemOpenChangeHandler;
  /** Store owned by the matching Accordion Root. */
  store: AccordionStore;
  /** Required unique Item value. */
  value: string;
}

type AccordionItemListener = (state: AccordionItemState) => void;

/** Non-focusable owner for one Accordion Trigger and Panel. */
export class AccordionItemRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: AccordionStore;
  private snapshot: AccordionItemState;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;
  private readonly stateListeners = new Set<AccordionItemListener>();

  /** Creates and registers one Accordion Item. */
  constructor(ctx: RenderContext, options: AccordionItemOptions) {
    const { disabled, onOpenChange, store, value, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    store.registerItem(this, { disabled, onOpenChange, value });
    this.snapshot = store.getItemState(this);
    this.unsubscribe = store.subscribe(() => this.publishState());
  }

  /** Store associated with this Item. */
  get store(): AccordionStore {
    return this._store;
  }

  set store(store: AccordionStore) {
    if (store !== this._store) {
      throw new Error("Accordion.Item store cannot be replaced");
    }
  }

  /** Current immutable Item state. */
  getState(): AccordionItemState {
    return this.snapshot;
  }

  /** Subscribes to Item state changes. */
  subscribe(listener: AccordionItemListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Stable Item value. */
  get value(): string {
    return this.snapshot.value;
  }

  set value(value: string) {
    if (!this.coordinationReleased) this._store.setItemValue(this, value);
  }

  /** Effective Root or Item disablement. */
  get disabled(): boolean {
    return this.snapshot.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    if (!this.coordinationReleased) {
      this._store.setItemDisabled(this, disabled ?? false);
    }
  }

  /** Replaces this Item's open-change callback. */
  set onOpenChange(callback: AccordionItemOpenChangeHandler | undefined) {
    if (!this.coordinationReleased) {
      this._store.setItemOnOpenChange(this, callback);
    }
  }

  /** Requests the inverse open state for this Item. */
  toggle(details: AccordionValueChangeDetails = IMPERATIVE_DETAILS): void {
    if (!this.coordinationReleased) {
      this._store.requestItemToggle(this, details);
    }
  }

  /** Registers this Item's one live Trigger. */
  registerTrigger(owner: object, focus: () => void): void {
    if (!this.coordinationReleased) {
      this._store.registerTrigger(this, owner, focus);
    }
  }

  /** Removes this Item's Trigger registration. */
  unregisterTrigger(owner: object): void {
    this._store.unregisterTrigger(this, owner);
  }

  /** Moves focus from this Item to another available Trigger. */
  moveTriggerFocus(target: AccordionFocusTarget): boolean {
    return (
      !this.coordinationReleased && this._store.moveTriggerFocus(this, target)
    );
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases Item registration and descendant coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently ends this Item and descendant Part lifetimes. */
  endCoordinationLifetime(options: { preserveValue?: boolean } = {}): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          child instanceof AccordionTriggerRenderable &&
          child.item === this
        ) {
          child.endCoordinationLifetime();
        } else if (
          child instanceof AccordionPanelRenderable &&
          child.item === this
        ) {
          child.endCoordinationLifetime();
        }
        visit(child);
      }
    };
    visit(this);
    this.unsubscribe();
    this._store.unregisterItem(this, !options.preserveValue);
    this.snapshot = Object.freeze({
      disabled: true,
      open: false,
      value: this.snapshot.value,
    });
    this.stateListeners.clear();
  }

  private publishState(): void {
    if (this.coordinationReleased) return;
    const next = this._store.getItemState(this);
    if (
      next.disabled === this.snapshot.disabled &&
      next.open === this.snapshot.open &&
      next.value === this.snapshot.value
    ) {
      return;
    }
    this.snapshot = next;
    this.requestRender();
    for (const listener of [...this.stateListeners]) {
      if (this.stateListeners.has(listener)) listener(next);
    }
  }
}

/** Native OpenTUI options for an Accordion Trigger. */
export interface AccordionTriggerOptions extends BoxOptions {
  /** Owning Accordion Item. */
  item: AccordionItemRenderable;
}

type AccordionTriggerListener = (state: AccordionTriggerState) => void;

/** Focusable Part that toggles its Accordion Item. */
export class AccordionTriggerRenderable extends PressableRenderable {
  private readonly _item: AccordionItemRenderable;
  private readonly unsubscribe: () => void;
  private snapshot: AccordionTriggerState;
  private focusedState = false;
  private coordinationReleased = false;
  private readonly stateListeners = new Set<AccordionTriggerListener>();

  /** Creates an Accordion Trigger Renderable. */
  constructor(ctx: RenderContext, options: AccordionTriggerOptions) {
    const { item, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._item = item;
    this.snapshot = this.createState();
    item.registerTrigger(this, () => this.focus());
    this.attachPressable({
      get state() {
        return item.getState();
      },
      setFocused: (focused) => this.setFocusedState(focused),
      subscribe: (listener) => item.subscribe(listener),
    });
    this.unsubscribe = item.subscribe(() => this.publishState());
  }

  /** Item associated with this Trigger. */
  get item(): AccordionItemRenderable {
    return this._item;
  }

  set item(item: AccordionItemRenderable) {
    if (item !== this._item) {
      throw new Error("Accordion.Trigger item cannot be replaced");
    }
  }

  /** Current immutable Trigger state. */
  getState(): AccordionTriggerState {
    return this.snapshot;
  }

  /** Subscribes to Trigger state changes. */
  subscribe(listener: AccordionTriggerListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  protected handlePress(details: PressDetails): void {
    if (!this.coordinationReleased) this._item.toggle(details);
  }

  protected override handleUnclaimedKey(key: KeyEvent): boolean {
    if (this.coordinationReleased) return false;
    if (key.name === "up") return this._item.moveTriggerFocus("previous");
    if (key.name === "down") return this._item.moveTriggerFocus("next");
    if (key.name === "home") return this._item.moveTriggerFocus("first");
    if (key.name === "end") return this._item.moveTriggerFocus("last");
    return false;
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases Trigger subscriptions and interaction. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently releases this Trigger's coordination lifetime. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.detachPressable();
    this._item.unregisterTrigger(this);
    this.unsubscribe();
    this._focusable = false;
    if (this._focused) super.blur();
    this.focusedState = false;
    this.snapshot = this.createState();
    this.stateListeners.clear();
  }

  private setFocusedState(focused: boolean): void {
    if (this.coordinationReleased || this.focusedState === focused) return;
    this.focusedState = focused;
    this.publishState();
  }

  private createState(): AccordionTriggerState {
    return Object.freeze({
      ...this._item.getState(),
      focused: this.focusedState,
    });
  }

  private publishState(): void {
    if (this.coordinationReleased) return;
    const next = this.createState();
    if (
      next.disabled === this.snapshot.disabled &&
      next.focused === this.snapshot.focused &&
      next.open === this.snapshot.open &&
      next.value === this.snapshot.value
    ) {
      return;
    }
    this.snapshot = next;
    this.requestRender();
    for (const listener of [...this.stateListeners]) {
      if (this.stateListeners.has(listener)) listener(next);
    }
  }
}

/** Native OpenTUI options for an Accordion Panel. */
export interface AccordionPanelOptions extends BoxOptions {
  /** Owning Accordion Item. */
  item: AccordionItemRenderable;
}

type AccordionPanelListener = (state: AccordionPanelState) => void;

/** State-reflecting content Panel for one Accordion Item. */
export class AccordionPanelRenderable extends BoxRenderable {
  private readonly _item: AccordionItemRenderable;
  private consumerVisible: boolean;
  private snapshot: AccordionPanelState;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;
  private readonly stateListeners = new Set<AccordionPanelListener>();

  /** Creates an Accordion Panel Renderable. */
  constructor(ctx: RenderContext, options: AccordionPanelOptions) {
    const { item, visible = true, ...boxOptions } = options;
    const state = item.getState();
    super(ctx, { ...boxOptions, visible: visible && state.open });
    this._item = item;
    this.consumerVisible = visible;
    this.snapshot = state;
    this.unsubscribe = item.subscribe(() => this.syncState());
  }

  /** Item associated with this Panel. */
  get item(): AccordionItemRenderable {
    return this._item;
  }

  set item(item: AccordionItemRenderable) {
    if (item !== this._item) {
      throw new Error("Accordion.Panel item cannot be replaced");
    }
  }

  /** Current immutable Panel state. */
  getState(): AccordionPanelState {
    return this.snapshot;
  }

  /** Subscribes to Panel state changes. */
  subscribe(listener: AccordionPanelListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  override get visible(): boolean {
    return super.visible;
  }

  override set visible(visible: boolean | null | undefined) {
    if (this.coordinationReleased) return;
    this.consumerVisible = visible ?? true;
    this.syncState();
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Releases Panel subscriptions. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  /** Permanently releases this Panel's coordination lifetime. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.unsubscribe();
    super.visible = false;
    this.snapshot = Object.freeze({
      disabled: true,
      open: false,
      value: this.snapshot.value,
    });
    this.stateListeners.clear();
  }

  private syncState(): void {
    if (this.coordinationReleased) return;
    const next = this._item.getState();
    if (super.visible !== this.consumerVisible && next.open) {
      super.visible = this.consumerVisible;
    } else if (super.visible !== false && !next.open) {
      super.visible = false;
    }
    if (
      next.disabled === this.snapshot.disabled &&
      next.open === this.snapshot.open &&
      next.value === this.snapshot.value
    ) {
      return;
    }
    this.snapshot = next;
    this.requestRender();
    for (const listener of [...this.stateListeners]) {
      if (this.stateListeners.has(listener)) listener(next);
    }
  }
}
