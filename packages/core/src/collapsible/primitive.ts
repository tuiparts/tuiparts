import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";

/** Cause of one accepted Collapsible open-state request. */
export type CollapsibleOpenChangeDetails = PressDetails;

/** Immutable observable state for one Collapsible Root. */
export interface CollapsibleState {
  /** Whether the Panel is open. */
  readonly open: boolean;
  /** Whether interaction is disabled. */
  readonly disabled: boolean;
}

/** Immutable observable state for one Collapsible Trigger. */
export interface CollapsibleTriggerState extends CollapsibleState {
  /** Whether this Trigger owns actual OpenTUI focus. */
  readonly focused: boolean;
}

/** Immutable observable state for one Collapsible Panel. */
export interface CollapsiblePanelState {
  /** Whether the owning Collapsible is open. */
  readonly open: boolean;
}

/** Callback invoked for one accepted semantic open-state request. */
export type CollapsibleOpenChangeHandler = (
  open: boolean,
  details: CollapsibleOpenChangeDetails,
) => void;

/** Options used to construct a Collapsible Store. */
export interface CollapsibleStoreOptions {
  /** Initial open state when uncontrolled. */
  readonly defaultOpen?: boolean;
  /** Whether interaction is disabled. */
  readonly disabled?: boolean;
  /** Callback for semantic open-state requests. */
  readonly onOpenChange?: CollapsibleOpenChangeHandler;
  /** Controlled open state. */
  readonly open?: boolean;
}

type CollapsibleStateListener = (state: CollapsibleState) => void;

const IMPERATIVE_DETAILS: CollapsibleOpenChangeDetails = Object.freeze({
  source: "imperative",
});

/** Framework-neutral open-state owner for Collapsible Parts. */
export class CollapsibleStore {
  private controlled: boolean;
  private snapshot: CollapsibleState;
  private onOpenChangeCallback?: CollapsibleOpenChangeHandler;
  private rootOwner?: object;
  private readonly listeners = new Set<CollapsibleStateListener>();

  /** Creates a Collapsible Store. */
  constructor(options: CollapsibleStoreOptions = {}) {
    this.controlled = options.open !== undefined;
    this.snapshot = Object.freeze({
      disabled: options.disabled ?? false,
      open: options.open ?? options.defaultOpen ?? false,
    });
    this.onOpenChangeCallback = options.onOpenChange;
  }

  /** Current immutable Root state. */
  get state(): CollapsibleState {
    return this.snapshot;
  }

  /** Subscribes to Root state changes. */
  subscribe(listener: CollapsibleStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Claims this Store for one live Root coordination lifetime. */
  attachRoot(owner: object): void {
    if (this.rootOwner && this.rootOwner !== owner) {
      throw new Error(
        "Collapsible Store may be adopted by only one live Collapsible.Root",
      );
    }
    this.rootOwner = owner;
  }

  /** Releases one Root's claim without ending an externally owned Store. */
  detachRoot(owner: object): void {
    if (this.rootOwner === owner) this.rootOwner = undefined;
  }

  /** Requests a specific open state through the active ownership model. */
  setOpen(
    open: boolean,
    details: CollapsibleOpenChangeDetails = IMPERATIVE_DETAILS,
  ): void {
    if (this.snapshot.disabled || open === this.snapshot.open) return;
    const immutableDetails = Object.isFrozen(details)
      ? details
      : Object.freeze({ ...details });
    if (!this.controlled) this.update({ open });
    this.onOpenChangeCallback?.(open, immutableDetails);
  }

  /** Requests the inverse open state through the active ownership model. */
  toggle(details: CollapsibleOpenChangeDetails = IMPERATIVE_DETAILS): void {
    this.setOpen(!this.snapshot.open, details);
  }

  /** Applies a controlled value, or releases control when undefined. */
  setControlledOpen(open: boolean | null | undefined): void {
    if (typeof open !== "boolean") {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this.update({ open });
  }

  /** Updates Root disablement. */
  setDisabled(disabled: boolean): void {
    this.update({ disabled });
  }

  /** Replaces the open-change callback. */
  setOnOpenChange(callback: CollapsibleOpenChangeHandler | undefined): void {
    this.onOpenChangeCallback = callback;
  }

  /** Releases Store listeners and callback ownership. */
  destroy(): void {
    this.listeners.clear();
    this.onOpenChangeCallback = undefined;
    this.rootOwner = undefined;
  }

  private update(next: Partial<CollapsibleState>): void {
    const state = { ...this.snapshot, ...next };
    if (
      state.disabled === this.snapshot.disabled &&
      state.open === this.snapshot.open
    ) {
      return;
    }
    this.snapshot = Object.freeze(state);
    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) listener(this.snapshot);
    }
  }
}

/** Native OpenTUI options plus Collapsible Root behavior props. */
export interface CollapsibleRootOptions
  extends BoxOptions,
    CollapsibleStoreOptions {
  /** Existing Store for imperative composition. */
  store?: CollapsibleStore;
}

/** Non-focusable ownership boundary for one Collapsible instance. */
export class CollapsibleRootRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: CollapsibleStore;
  private readonly ownsStore: boolean;
  private readonly unsubscribe: () => void;
  private ownershipReleased = false;

  /** Creates a Collapsible Root Renderable. */
  constructor(ctx: RenderContext, options: CollapsibleRootOptions = {}) {
    const { defaultOpen, disabled, onOpenChange, open, store, ...boxOptions } =
      options;
    super(ctx, boxOptions);
    this.ownsStore = !store;
    this._store =
      store ??
      new CollapsibleStore({
        defaultOpen,
        disabled,
        onOpenChange,
        open,
      });
    this._store.attachRoot(this);
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (onOpenChange !== undefined) store.setOnOpenChange(onOpenChange);
      if (open !== undefined) store.setControlledOpen(open);
    }
    this.unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  /** Store owned or adopted by this Root. */
  get store(): CollapsibleStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Root Store. */
  set store(store: CollapsibleStore) {
    if (store !== this._store) {
      throw new Error("Collapsible.Root store cannot be replaced");
    }
  }

  /** Current immutable Root state. */
  getState(): CollapsibleState {
    return this._store.state;
  }

  /** Current open state. */
  get open(): boolean {
    return this._store.state.open;
  }

  set open(open: boolean | null | undefined) {
    if (this.ownershipReleased) return;
    this._store.setControlledOpen(open);
  }

  /** Whether interaction is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    if (this.ownershipReleased) return;
    this._store.setDisabled(disabled ?? false);
  }

  /** Replaces the open-change callback. */
  set onOpenChange(callback: CollapsibleOpenChangeHandler | undefined) {
    if (this.ownershipReleased) return;
    this._store.setOnOpenChange(callback);
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

  /** Permanently ends this Root and every same-Store descendant Part. */
  endCoordinationLifetime(): void {
    if (this.ownershipReleased) return;
    this.ownershipReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          child instanceof CollapsibleTriggerRenderable &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime();
        } else if (
          child instanceof CollapsiblePanelRenderable &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime();
        }
        visit(child);
      }
    };
    visit(this);
    this.unsubscribe();
    this._store.detachRoot(this);
    if (this.ownsStore) this._store.destroy();
  }
}

/** Native OpenTUI options for a Collapsible Trigger. */
export interface CollapsibleTriggerOptions extends BoxOptions {
  /** Store owned by the matching Collapsible Root. */
  store: CollapsibleStore;
}

type CollapsibleTriggerListener = (state: CollapsibleTriggerState) => void;

/** Focusable Part that requests the inverse Collapsible open state. */
export class CollapsibleTriggerRenderable extends PressableRenderable {
  private readonly _store: CollapsibleStore;
  private readonly unsubscribe: () => void;
  private snapshot: CollapsibleTriggerState;
  private focusedState = false;
  private coordinationReleased = false;
  private readonly stateListeners = new Set<CollapsibleTriggerListener>();

  /** Creates a Collapsible Trigger Renderable. */
  constructor(ctx: RenderContext, options: CollapsibleTriggerOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    this.snapshot = this.createState();
    this.attachPressable({
      get state() {
        return store.state;
      },
      setFocused: (focused) => this.setFocusedState(focused),
      subscribe: (listener) => store.subscribe(listener),
    });
    this.unsubscribe = store.subscribe(() => this.publishState());
  }

  /** Store associated with this Trigger. */
  get store(): CollapsibleStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Trigger Store. */
  set store(store: CollapsibleStore) {
    if (store !== this._store) {
      throw new Error("Collapsible.Trigger store cannot be replaced");
    }
  }

  /** Current immutable Trigger state. */
  getState(): CollapsibleTriggerState {
    return this.snapshot;
  }

  /** Subscribes to Trigger state changes. */
  subscribe(listener: CollapsibleTriggerListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  protected handlePress(details: PressDetails): void {
    if (this.coordinationReleased) return;
    this._store.toggle(details);
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

  private createState(): CollapsibleTriggerState {
    return Object.freeze({
      disabled: this._store.state.disabled,
      focused: this.focusedState,
      open: this._store.state.open,
    });
  }

  private publishState(): void {
    if (this.coordinationReleased) return;
    const next = this.createState();
    if (
      next.disabled === this.snapshot.disabled &&
      next.focused === this.snapshot.focused &&
      next.open === this.snapshot.open
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

/** Native OpenTUI options for a Collapsible Panel. */
export interface CollapsiblePanelOptions extends BoxOptions {
  /** Store owned by the matching Collapsible Root. */
  store: CollapsibleStore;
}

type CollapsiblePanelListener = (state: CollapsiblePanelState) => void;

/** State-reflecting content Panel for one Collapsible instance. */
export class CollapsiblePanelRenderable extends BoxRenderable {
  private readonly _store: CollapsibleStore;
  private consumerVisible: boolean;
  private snapshot: CollapsiblePanelState;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;
  private readonly stateListeners = new Set<CollapsiblePanelListener>();

  /** Creates a Collapsible Panel Renderable. */
  constructor(ctx: RenderContext, options: CollapsiblePanelOptions) {
    const { store, visible = true, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: visible && store.state.open });
    this._store = store;
    this.consumerVisible = visible;
    this.snapshot = this.createState();
    this.unsubscribe = store.subscribe(() => this.syncState());
  }

  /** Store associated with this Panel. */
  get store(): CollapsibleStore {
    return this._store;
  }

  /** Prevents replacement of a mounted Panel Store. */
  set store(store: CollapsibleStore) {
    if (store !== this._store) {
      throw new Error("Collapsible.Panel store cannot be replaced");
    }
  }

  /** Current immutable Panel state. */
  getState(): CollapsiblePanelState {
    return this.snapshot;
  }

  /** Subscribes to Panel state changes. */
  subscribe(listener: CollapsiblePanelListener): () => void {
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
    this.snapshot = Object.freeze({ open: false });
    this.stateListeners.clear();
  }

  private createState(): CollapsiblePanelState {
    return Object.freeze({ open: this._store.state.open });
  }

  private syncState(): void {
    if (this.coordinationReleased) return;
    const next = this.createState();
    if (super.visible !== this.consumerVisible && next.open) {
      super.visible = this.consumerVisible;
    } else if (super.visible !== false && !next.open) {
      super.visible = false;
    }
    if (next.open === this.snapshot.open) return;
    this.snapshot = next;
    this.requestRender();
    for (const listener of [...this.stateListeners]) {
      if (this.stateListeners.has(listener)) listener(next);
    }
  }
}
