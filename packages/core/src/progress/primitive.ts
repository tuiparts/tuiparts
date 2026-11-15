import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";

/** Immutable observable state for one Progress Root. */
export interface ProgressState {
  /** Current progress value, or null for indeterminate progress. */
  readonly value: number | null;
  /** Maximum progress value (defaults to 100). */
  readonly max: number;
  /** Normalized progress percentage (0-100), or null for indeterminate. */
  readonly percentage: number | null;
}

/** Callback invoked when the progress value changes. */
export type ProgressValueChangeHandler = (value: number | null) => void;

/** Options used to construct a Progress Store. */
export interface ProgressStoreOptions {
  /** Initial value when uncontrolled. */
  readonly defaultValue?: number | null;
  /** Maximum value (must be > 0, defaults to 100). */
  readonly max?: number;
  /** Callback for value changes. */
  readonly onValueChange?: ProgressValueChangeHandler;
  /** Controlled progress value. */
  readonly value?: number | null;
}

type ProgressStateListener = (state: ProgressState) => void;

function normalizeMax(max: number | undefined): number {
  if (max === undefined || Number.isNaN(max) || max <= 0) return 100;
  return max;
}

function normalizeValue(
  value: number | null | undefined,
  max: number,
): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(0, value));
}

function computePercentage(value: number | null, max: number): number | null {
  if (value === null) return null;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** Framework-neutral value and progress state owner. */
export class ProgressStore {
  private controlled: boolean;
  private snapshot: ProgressState;
  private onValueChangeCallback?: ProgressValueChangeHandler;
  private rootOwner?: object;
  private readonly listeners = new Set<ProgressStateListener>();

  constructor(options: ProgressStoreOptions = {}) {
    this.controlled = options.value !== undefined;
    const max = normalizeMax(options.max);
    const rawVal =
      options.value !== undefined
        ? options.value
        : (options.defaultValue ?? null);
    const value = normalizeValue(rawVal, max);
    const percentage = computePercentage(value, max);

    this.snapshot = Object.freeze({
      max,
      percentage,
      value,
    });
    this.onValueChangeCallback = options.onValueChange;
  }

  get state(): ProgressState {
    return this.snapshot;
  }

  get isControlled(): boolean {
    return this.controlled;
  }

  subscribe(listener: ProgressStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  attachRoot(owner: object): void {
    if (this.rootOwner && this.rootOwner !== owner) {
      throw new Error(
        "Progress Store may be adopted by only one live Progress.Root",
      );
    }
    this.rootOwner = owner;
  }

  detachRoot(owner: object): void {
    if (this.rootOwner === owner) this.rootOwner = undefined;
  }

  setValue(nextValue: number | null): void {
    const value = normalizeValue(nextValue, this.snapshot.max);
    if (value === this.snapshot.value) return;

    if (!this.controlled) {
      const percentage = computePercentage(value, this.snapshot.max);
      this.snapshot = Object.freeze({
        ...this.snapshot,
        percentage,
        value,
      });
      for (const listener of this.listeners) listener(this.snapshot);
    }

    this.onValueChangeCallback?.(value);
  }

  setControlledValue(nextValue: number | null | undefined): void {
    if (nextValue === undefined) {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    const value = normalizeValue(nextValue, this.snapshot.max);
    if (value === this.snapshot.value) return;

    const percentage = computePercentage(value, this.snapshot.max);
    this.snapshot = Object.freeze({
      ...this.snapshot,
      percentage,
      value,
    });
    for (const listener of this.listeners) listener(this.snapshot);
  }

  setMax(nextMax: number): void {
    const max = normalizeMax(nextMax);
    if (max === this.snapshot.max) return;

    const value = normalizeValue(this.snapshot.value, max);
    const percentage = computePercentage(value, max);
    this.snapshot = Object.freeze({
      max,
      percentage,
      value,
    });
    for (const listener of this.listeners) listener(this.snapshot);
  }

  setOnValueChange(callback: ProgressValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  destroy(): void {
    this.listeners.clear();
    this.onValueChangeCallback = undefined;
    this.rootOwner = undefined;
  }
}

/** Options used to construct a Progress Root Renderable. */
export interface ProgressRootOptions extends BoxOptions, ProgressStoreOptions {
  store?: ProgressStore;
}

/** Core renderable container for Progress. */
export class ProgressRootRenderable extends BoxRenderable {
  protected _store: ProgressStore;
  private coordinationReleased = false;

  constructor(ctx: RenderContext, options: ProgressRootOptions = {}) {
    const { defaultValue, max, onValueChange, store, value, ...boxOptions } =
      options;
    super(ctx, boxOptions);
    this._store =
      store ?? new ProgressStore({ defaultValue, max, onValueChange, value });
    this._store.attachRoot(this);
    if (store) {
      if (max !== undefined) store.setMax(max);
      if (value !== undefined) store.setControlledValue(value);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
    }
  }

  getState(): ProgressState {
    return this._store.state;
  }

  subscribe(listener: ProgressStateListener): () => void {
    return this._store.subscribe(listener);
  }

  get store(): ProgressStore {
    return this._store;
  }

  set store(store: ProgressStore) {
    if (this.coordinationReleased || this._store === store) return;
    this._store.detachRoot(this);
    this._store = store;
    this._store.attachRoot(this);
  }

  get value(): number | null {
    return this._store.state.value;
  }

  set value(value: number | null | undefined) {
    if (this._store.isControlled) {
      this._store.setControlledValue(value);
    } else {
      this._store.setValue(value ?? null);
    }
  }

  get max(): number {
    return this._store.state.max;
  }

  set max(max: number | undefined) {
    this._store.setMax(max ?? 100);
  }

  set onValueChange(callback: ProgressValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this._store.detachRoot(this);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

/** Options used to construct a Progress Indicator Renderable. */
export interface ProgressIndicatorOptions extends BoxOptions {
  store?: ProgressStore;
}

/** Core renderable indicator for Progress that updates its width to reflect percentage. */
export class ProgressIndicatorRenderable extends BoxRenderable {
  private _store: ProgressStore;
  private _unsubscribe: () => void;
  private coordinationReleased = false;
  private autoWidth: boolean;

  constructor(ctx: RenderContext, options: ProgressIndicatorOptions = {}) {
    const { store, width, ...boxOptions } = options;
    if (!store) {
      throw new Error("Progress.Indicator requires a ProgressStore");
    }
    const autoWidth = width === undefined;
    const percentage = store.state.percentage;
    super(ctx, {
      width:
        width ?? (percentage !== null ? `${Math.round(percentage)}%` : "0%"),
      ...boxOptions,
    });
    this.autoWidth = autoWidth;
    this._store = store;
    this._unsubscribe = store.subscribe((state) => {
      if (this.autoWidth && state.percentage !== null) {
        this.width = `${Math.min(100, Math.max(0, Math.round(state.percentage)))}%`;
      }
    });
  }

  getState(): ProgressState {
    return this._store.state;
  }

  get percentage(): number | null {
    return this._store.state.percentage;
  }

  get store(): ProgressStore {
    return this._store;
  }

  set store(store: ProgressStore) {
    if (this.coordinationReleased || this._store === store) return;
    this._unsubscribe();
    this._store = store;
    if (this.autoWidth && store.state.percentage !== null) {
      this.width = `${Math.min(100, Math.max(0, Math.round(store.state.percentage)))}%`;
    }
    this._unsubscribe = store.subscribe((state) => {
      if (this.autoWidth && state.percentage !== null) {
        this.width = `${Math.min(100, Math.max(0, Math.round(state.percentage)))}%`;
      }
    });
  }

  protected override onRemove(): void {
    if (this.coordinationReleased) return;
    this._unsubscribe();
    this.coordinationReleased = true;
    super.onRemove();
  }

  override destroy(): void {
    if (!this.coordinationReleased) {
      this._unsubscribe();
      this.coordinationReleased = true;
    }
    super.destroy();
  }
}
