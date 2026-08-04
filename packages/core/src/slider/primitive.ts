import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type MouseEvent,
  SliderRenderable as OpenTuiSliderRenderable,
  type RenderContext,
  RGBA,
  type SliderOptions,
} from "@opentui/core";

/** Axis used for Slider keyboard and pointer behavior. */
export type SliderOrientation = "horizontal" | "vertical";

/** Key claimed by Slider keyboard behavior. */
export type SliderKey =
  | "down"
  | "end"
  | "home"
  | "left"
  | "pagedown"
  | "pageup"
  | "right"
  | "up";

/** Semantic cause of one Slider value request or commit. */
export type SliderChangeReason = "bound" | "drag" | "step" | "track";

/** Immutable terminal details for one Slider value request or commit. */
export interface SliderChangeDetails {
  /** Primary pointer button for pointer-produced requests. */
  readonly button?: 0;
  /** Claimed key for keyboard requests. */
  readonly key?: SliderKey;
  /** Slider operation that produced the request. */
  readonly reason: SliderChangeReason;
  /** Terminal interaction source. */
  readonly source: "keyboard" | "pointer";
}

/** Readonly observable Slider state. */
export interface SliderState {
  /** Whether every focus and mutation seam is disabled. */
  readonly disabled: boolean;
  /** Whether a captured pointer drag is active. */
  readonly dragging: boolean;
  /** Whether Track owns actual OpenTUI focus. */
  readonly focused: boolean;
  /** Large keyboard step. */
  readonly largeStep: number;
  /** Inclusive maximum. */
  readonly max: number;
  /** Inclusive minimum. */
  readonly min: number;
  /** Keyboard and pointer orientation. */
  readonly orientation: SliderOrientation;
  /** Whether mutation is blocked while focus remains available. */
  readonly readOnly: boolean;
  /** Normal keyboard step and pointer grid size. */
  readonly step: number;
  /** Current numeric value. */
  readonly value: number;
}

/** Callback invoked for one accepted Slider value request. */
export type SliderValueChangeHandler = (
  value: number,
  details: SliderChangeDetails,
) => void;

/** Callback invoked when one Slider interaction commits. */
export type SliderValueCommitHandler = (
  value: number,
  details: SliderChangeDetails,
) => void;

/** Options used to construct a Slider Store. */
export interface SliderStoreOptions {
  /** Initial uncontrolled value; defaults to `min`. */
  readonly defaultValue?: number;
  /** Whether every focus and mutation seam is disabled. */
  readonly disabled?: boolean;
  /** Large keyboard step; defaults to `10`. */
  readonly largeStep?: number;
  /** Inclusive maximum; defaults to `100`. */
  readonly max?: number;
  /** Inclusive minimum; defaults to `0`. */
  readonly min?: number;
  /** Callback for accepted value requests. */
  readonly onValueChange?: SliderValueChangeHandler;
  /** Callback for completed interactions. */
  readonly onValueCommit?: SliderValueCommitHandler;
  /** Keyboard and pointer orientation; defaults to horizontal. */
  readonly orientation?: SliderOrientation;
  /** Whether mutation is blocked while focus remains available. */
  readonly readOnly?: boolean;
  /** Normal keyboard step and pointer grid size; defaults to `1`. */
  readonly step?: number;
  /** Controlled numeric value. */
  readonly value?: number;
}

type SliderStateListener = (state: SliderState) => void;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Slider ${name} must be finite`);
  }
}

function assertPositiveStep(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Slider ${name} must be a positive finite number`);
  }
}

function decimalPlaces(value: number): number {
  const text = value.toString().toLowerCase();
  const [coefficient = text, exponentText = "0"] = text.split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText));
}

function toScaledInteger(value: number, precision: number): bigint {
  const text = Math.abs(value).toString().toLowerCase();
  const [coefficient = text, exponentText = "0"] = text.split("e");
  const [integer = "0", fraction = ""] = coefficient.split(".");
  const places = fraction.length - Number(exponentText);
  const zeros = precision - places;
  const magnitude = BigInt(`${integer}${fraction}`) * 10n ** BigInt(zeros);
  return value < 0 ? -magnitude : magnitude;
}

function addDecimal(value: number, delta: number): number {
  const precision = Math.max(decimalPlaces(value), decimalPlaces(delta));
  const total =
    toScaledInteger(value, precision) + toScaledInteger(delta, precision);
  if (precision === 0) return Number(total);
  const sign = total < 0 ? "-" : "";
  const digits = (total < 0 ? -total : total)
    .toString()
    .padStart(precision + 1, "0");
  const decimalIndex = digits.length - precision;
  return Number(
    `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`,
  );
}

/** Framework-neutral Slider value, interaction, and commit owner. */
export class SliderStore {
  private snapshot: SliderState;
  private controlled: boolean;
  private readonly listeners = new Set<SliderStateListener>();
  private onValueChangeCallback?: SliderValueChangeHandler;
  private onValueCommitCallback?: SliderValueCommitHandler;
  private mutating = false;
  private readonly mutationQueue: Array<() => void> = [];
  private pointerActive = false;
  private pointerChanged = false;
  private pointerLastRequested?: number;
  private pointerLastDetails?: SliderChangeDetails;

  /** Creates a Slider Store. */
  constructor(options: SliderStoreOptions = {}) {
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const step = options.step ?? 1;
    const largeStep = options.largeStep ?? 10;
    assertFinite("min", min);
    assertFinite("max", max);
    if (min > max) throw new Error("Slider min cannot exceed max");
    assertPositiveStep("step", step);
    assertPositiveStep("largeStep", largeStep);
    this.controlled = options.value !== undefined;
    const initial = this.normalizeExternal(
      options.value !== undefined
        ? options.value
        : (options.defaultValue ?? min),
      min,
      max,
    );
    this.snapshot = Object.freeze({
      disabled: options.disabled ?? false,
      dragging: false,
      focused: false,
      largeStep,
      max,
      min,
      orientation: options.orientation ?? "horizontal",
      readOnly: options.readOnly ?? false,
      step,
      value: initial,
    });
    this.onValueChangeCallback = options.onValueChange;
    this.onValueCommitCallback = options.onValueCommit;
  }

  /** Current immutable Slider state. */
  get state(): SliderState {
    return this.snapshot;
  }

  /** Whether one native pointer interaction is active. */
  get hasActivePointer(): boolean {
    return this.pointerActive;
  }

  /** Subscribes to observable state changes. */
  subscribe(listener: SliderStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Applies a controlled value or releases control at the observed value. */
  setValue(value: number | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this.controlled = false;
        return;
      }
      this.controlled = true;
      this.update({ value: this.normalizeExternal(value) });
    });
  }

  /** Atomically updates inclusive bounds and repairs the observed value. */
  setBounds(min: number, max: number): void {
    assertFinite("min", min);
    assertFinite("max", max);
    if (min > max) throw new Error("Slider min cannot exceed max");
    if (min === this.snapshot.min && max === this.snapshot.max) return;
    this.runMutation(() => {
      this.cancelPointerInternal();
      this.update({
        max,
        min,
        value: this.normalizeExternal(this.snapshot.value, min, max),
      });
    });
  }

  /** Updates the normal keyboard step and pointer grid size. */
  setStep(step: number): void {
    assertPositiveStep("step", step);
    this.runMutation(() => this.update({ step }));
  }

  /** Updates the large keyboard step. */
  setLargeStep(largeStep: number): void {
    assertPositiveStep("largeStep", largeStep);
    this.runMutation(() => this.update({ largeStep }));
  }

  /** Updates keyboard and pointer orientation. */
  setOrientation(orientation: SliderOrientation): void {
    if (orientation === this.snapshot.orientation) return;
    this.runMutation(() => {
      this.cancelPointerInternal();
      this.update({ orientation });
    });
  }

  /** Updates global disablement. */
  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) this.cancelPointerInternal();
      this.update({
        disabled,
        focused: disabled ? false : this.snapshot.focused,
      });
    });
  }

  /** Updates read-only behavior. */
  setReadOnly(readOnly: boolean): void {
    this.runMutation(() => {
      if (readOnly) this.cancelPointerInternal();
      this.update({ readOnly });
    });
  }

  /** Replaces the value-change callback. */
  setOnValueChange(callback: SliderValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  /** Replaces the value-commit callback. */
  setOnValueCommit(callback: SliderValueCommitHandler | undefined): void {
    this.onValueCommitCallback = callback;
  }

  /** Reflects actual Track focus. */
  setFocused(focused: boolean): void {
    if (focused && this.snapshot.disabled) return;
    this.runMutation(() => this.update({ focused }));
  }

  /** Requests one orientation-aware keyboard step or bound. */
  stepByKey(key: KeyEvent): boolean {
    if (
      this.snapshot.disabled ||
      this.snapshot.readOnly ||
      key.defaultPrevented ||
      key.ctrl ||
      key.meta ||
      key.option ||
      key.shift ||
      key.super ||
      key.hyper
    )
      return false;

    let direction: 1 | -1;
    let keyName: SliderKey;
    let amount = this.snapshot.step;
    let reason: SliderChangeReason = "step";
    if (key.name === "home") {
      direction = -1;
      keyName = "home";
      reason = "bound";
    } else if (key.name === "end") {
      direction = 1;
      keyName = "end";
      reason = "bound";
    } else if (key.name === "pageup") {
      direction = 1;
      keyName = "pageup";
      amount = this.snapshot.largeStep;
    } else if (key.name === "pagedown") {
      direction = -1;
      keyName = "pagedown";
      amount = this.snapshot.largeStep;
    } else if (
      this.snapshot.orientation === "horizontal" &&
      (key.name === "left" || key.name === "right")
    ) {
      direction = key.name === "right" ? 1 : -1;
      keyName = key.name === "right" ? "right" : "left";
    } else if (
      this.snapshot.orientation === "vertical" &&
      (key.name === "down" || key.name === "up")
    ) {
      direction = key.name === "up" ? 1 : -1;
      keyName = key.name === "up" ? "up" : "down";
    } else {
      return false;
    }

    const requested =
      reason === "bound"
        ? direction === 1
          ? this.snapshot.max
          : this.snapshot.min
        : this.clamp(addDecimal(this.snapshot.value, direction * amount));
    const details = Object.freeze<SliderChangeDetails>({
      key: keyName,
      reason,
      source: "keyboard",
    });
    if (this.requestValue(requested, details)) {
      this.onValueCommitCallback?.(requested, details);
    }
    return true;
  }

  /** Begins one accepted native Track pointer interaction. */
  startPointer(): boolean {
    if (this.pointerActive || this.snapshot.disabled || this.snapshot.readOnly)
      return false;
    this.pointerActive = true;
    this.pointerChanged = false;
    this.pointerLastRequested = this.snapshot.value;
    this.pointerLastDetails = undefined;
    return true;
  }

  /** Marks an active pointer interaction as a drag. */
  markPointerDragging(): void {
    if (!this.pointerActive || this.snapshot.dragging) return;
    this.runMutation(() => this.update({ dragging: true }));
  }

  /** Requests the stepped domain value represented by a Track ratio. */
  requestPointerRatio(ratio: number): void {
    if (!this.pointerActive || !Number.isFinite(ratio)) return;
    const boundedRatio = Math.max(0, Math.min(1, ratio));
    const raw =
      this.snapshot.min +
      boundedRatio * (this.snapshot.max - this.snapshot.min);
    const requested = this.snapPointerValue(raw, boundedRatio);
    if (Object.is(requested, this.pointerLastRequested)) return;
    const details = Object.freeze<SliderChangeDetails>({
      button: 0,
      reason: this.snapshot.dragging ? "drag" : "track",
      source: "pointer",
    });
    this.pointerLastRequested = requested;
    this.pointerLastDetails = details;
    if (this.requestValue(requested, details, true)) {
      this.pointerChanged = true;
    }
  }

  /** Finishes an active pointer interaction and commits its final request. */
  finishPointer(): void {
    if (!this.pointerActive) return;
    this.runMutation(() => {
      const changed = this.pointerChanged;
      const requested = this.pointerLastRequested;
      const details = this.pointerLastDetails;
      this.pointerActive = false;
      this.pointerChanged = false;
      this.pointerLastRequested = undefined;
      this.pointerLastDetails = undefined;
      this.update({ dragging: false });
      if (changed && requested !== undefined && details) {
        this.onValueCommitCallback?.(requested, details);
      }
    });
  }

  /** Cancels active pointer coordination without committing. */
  cancelPointer(): void {
    this.runMutation(() => this.cancelPointerInternal());
  }

  private requestValue(
    requested: number,
    details: SliderChangeDetails,
    pointer = false,
  ): boolean {
    if (this.snapshot.disabled || this.snapshot.readOnly) return false;
    if (!pointer && Object.is(requested, this.snapshot.value)) return false;
    if (!this.controlled) this.update({ value: requested });
    this.onValueChangeCallback?.(requested, details);
    return true;
  }

  private snapPointerValue(value: number, ratio: number): number {
    if (ratio <= 0) return this.snapshot.min;
    if (ratio >= 1) return this.snapshot.max;
    const index = Math.round((value - this.snapshot.min) / this.snapshot.step);
    return this.clamp(
      addDecimal(this.snapshot.min, index * this.snapshot.step),
    );
  }

  private normalizeExternal(value: number, min?: number, max?: number): number {
    assertFinite("value", value);
    const resolvedMin = min ?? this.snapshot.min;
    const resolvedMax = max ?? this.snapshot.max;
    return Math.max(resolvedMin, Math.min(resolvedMax, value));
  }

  private clamp(value: number): number {
    return Math.max(this.snapshot.min, Math.min(this.snapshot.max, value));
  }

  private cancelPointerInternal(): void {
    this.pointerActive = false;
    this.pointerChanged = false;
    this.pointerLastRequested = undefined;
    this.pointerLastDetails = undefined;
    this.update({ dragging: false });
  }

  private update(next: Partial<SliderState>): void {
    const state = { ...this.snapshot, ...next };
    if (
      state.disabled === this.snapshot.disabled &&
      state.dragging === this.snapshot.dragging &&
      state.focused === this.snapshot.focused &&
      state.largeStep === this.snapshot.largeStep &&
      state.max === this.snapshot.max &&
      state.min === this.snapshot.min &&
      state.orientation === this.snapshot.orientation &&
      state.readOnly === this.snapshot.readOnly &&
      state.step === this.snapshot.step &&
      Object.is(state.value, this.snapshot.value)
    )
      return;
    this.snapshot = Object.freeze(state);
    this.notify();
  }

  private notify(): void {
    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) listener(this.snapshot);
    }
  }

  private runMutation(mutation: () => void): void {
    if (this.mutating) {
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
}

type SliderPartKind = "range" | "thumb" | "track";

interface SliderOwnership {
  readonly parts: Map<SliderPartKind, object>;
  root?: object;
}

const ownershipByStore = new WeakMap<object, SliderOwnership>();
const TRANSPARENT = RGBA.fromInts(0, 0, 0, 0);

function getOwnership(store: object): SliderOwnership {
  let ownership = ownershipByStore.get(store);
  if (!ownership) {
    ownership = { parts: new Map() };
    ownershipByStore.set(store, ownership);
  }
  return ownership;
}

function attachRoot(store: object, owner: object): void {
  const ownership = getOwnership(store);
  if (ownership.root && ownership.root !== owner) {
    throw new Error("Slider Store may be adopted by only one live Slider.Root");
  }
  ownership.root = owner;
}

function detachRoot(store: object, owner: object): void {
  const ownership = getOwnership(store);
  if (ownership.root === owner) ownership.root = undefined;
}

function attachPart(
  store: object,
  kind: SliderPartKind,
  owner: object,
): () => void {
  const ownership = getOwnership(store);
  const current = ownership.parts.get(kind);
  if (current && current !== owner) {
    throw new Error(`Slider.Root may contain only one live ${kind}`);
  }
  ownership.parts.set(kind, owner);
  return () => {
    if (ownership.parts.get(kind) === owner) ownership.parts.delete(kind);
  };
}

/** Native Box options plus Slider Root behavior props. */
export interface SliderRootOptions extends BoxOptions, SliderStoreOptions {
  /** Existing Store for imperative composition. */
  readonly store?: SliderStore;
}

/** Non-focusable owner for one Slider composition. */
export class SliderRootRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: SliderStore;
  private readonly storeOwner: object;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;

  /** Creates a Slider Root Renderable. */
  constructor(ctx: RenderContext, options: SliderRootOptions = {}) {
    const {
      defaultValue,
      disabled,
      largeStep,
      max,
      min,
      onValueChange,
      onValueCommit,
      orientation,
      readOnly,
      step,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._store =
      store ??
      new SliderStore({
        defaultValue,
        disabled,
        largeStep,
        max,
        min,
        onValueChange,
        onValueCommit,
        orientation,
        readOnly,
        step,
        value,
      });
    this.storeOwner = {};
    attachRoot(this._store, this.storeOwner);
    if (store) {
      if (min !== undefined || max !== undefined) {
        store.setBounds(min ?? store.state.min, max ?? store.state.max);
      }
      if (disabled !== undefined) store.setDisabled(disabled);
      if (largeStep !== undefined) store.setLargeStep(largeStep);
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
      if (onValueCommit !== undefined) store.setOnValueCommit(onValueCommit);
      if (orientation !== undefined) store.setOrientation(orientation);
      if (readOnly !== undefined) store.setReadOnly(readOnly);
      if (step !== undefined) store.setStep(step);
      if (value !== undefined) store.setValue(value);
    }
    this.unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  /** Store owned or adopted by this Root. */
  get store(): SliderStore {
    return this._store;
  }

  set store(store: SliderStore) {
    if (store !== this._store)
      throw new Error("Slider.Root store cannot be replaced");
  }

  /** Current immutable Slider state. */
  getState(): SliderState {
    return this._store.state;
  }

  /** Current numeric value. */
  get value(): number {
    return this._store.state.value;
  }

  set value(value: number | undefined) {
    this._store.setValue(value);
  }

  /** Inclusive minimum. */
  get min(): number {
    return this._store.state.min;
  }

  set min(min: number | null | undefined) {
    this._store.setBounds(min ?? 0, this._store.state.max);
  }

  /** Inclusive maximum. */
  get max(): number {
    return this._store.state.max;
  }

  set max(max: number | null | undefined) {
    this._store.setBounds(this._store.state.min, max ?? 100);
  }

  /** Normal keyboard step and pointer grid size. */
  get step(): number {
    return this._store.state.step;
  }

  set step(step: number | null | undefined) {
    this._store.setStep(step ?? 1);
  }

  /** Large keyboard step. */
  get largeStep(): number {
    return this._store.state.largeStep;
  }

  set largeStep(largeStep: number | null | undefined) {
    this._store.setLargeStep(largeStep ?? 10);
  }

  /** Keyboard and pointer orientation. */
  get orientation(): SliderOrientation {
    return this._store.state.orientation;
  }

  set orientation(orientation: SliderOrientation | null | undefined) {
    this._store.setOrientation(orientation ?? "horizontal");
  }

  /** Whether every interaction seam is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  /** Whether mutation is blocked while focus remains available. */
  get readOnly(): boolean {
    return this._store.state.readOnly;
  }

  set readOnly(readOnly: boolean | null | undefined) {
    this._store.setReadOnly(readOnly ?? false);
  }

  /** Replaces the value-change callback. */
  set onValueChange(callback: SliderValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  /** Replaces the value-commit callback. */
  set onValueCommit(callback: SliderValueCommitHandler | undefined) {
    this._store.setOnValueCommit(callback);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently ends Root and same-Store descendant coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          (child instanceof SliderTrackRenderable ||
            child instanceof SliderRangeRenderable ||
            child instanceof SliderThumbRenderable) &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime();
        }
        visit(child);
      }
    };
    visit(this);
    this.unsubscribe();
    this._store.cancelPointer();
    detachRoot(this._store, this.storeOwner);
  }

  /** Releases Root and descendant coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

/** Native Slider properties reserved for private Track coordination. */
type ReservedTrackOption =
  | "backgroundColor"
  | "foregroundColor"
  | "max"
  | "min"
  | "onChange"
  | "orientation"
  | "value"
  | "viewPortSize";

/** Native layout options for Slider Track. */
export interface SliderTrackOptions
  extends Omit<SliderOptions, ReservedTrackOption> {
  /** Store owned by the matching Root. */
  readonly store: SliderStore;
}

/** Focusable Track using native Slider only for private pointer mechanics. */
export class SliderTrackRenderable extends OpenTuiSliderRenderable {
  private readonly _store: SliderStore;
  private readonly detachPart: () => void;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;
  private syncingNativeValue = false;
  private nativeGestureActive = false;

  /** Creates a Slider Track Renderable. */
  constructor(ctx: RenderContext, options: SliderTrackOptions) {
    const { store, ...layoutOptions } = options;
    let receiveNativeChange = (_percentage: number) => {};
    super(ctx, {
      ...layoutOptions,
      backgroundColor: TRANSPARENT,
      foregroundColor: TRANSPARENT,
      max: 100,
      min: 0,
      onChange: (percentage) => receiveNativeChange(percentage),
      orientation: store.state.orientation,
      value: SliderTrackRenderable.toNativePercentage(store.state),
      viewPortSize: 0.01,
    });
    this._store = store;
    this.detachPart = attachPart(store, "track", this);
    this._focusable = !store.state.disabled;
    receiveNativeChange = (percentage) => {
      if (
        this.coordinationReleased ||
        this.syncingNativeValue ||
        !this.nativeGestureActive
      )
        return;
      const ratio =
        store.state.orientation === "vertical"
          ? 1 - percentage / 100
          : percentage / 100;
      store.requestPointerRatio(ratio);
    };
    this.unsubscribe = store.subscribe(() => {
      this.syncFromStore(false);
      this.requestRender();
    });
    this.syncFromStore(true);
  }

  /** Owning Slider Store. */
  get store(): SliderStore {
    return this._store;
  }

  set store(store: SliderStore) {
    if (store !== this._store)
      throw new Error("Slider.Track store cannot be replaced");
  }

  /** Current immutable Slider state. */
  getState(): SliderState {
    return this._store.state;
  }

  /** Handles orientation keyboard steps and finite bounds. */
  override handleKeyPress(key: KeyEvent): boolean {
    if (this.coordinationReleased) return false;
    return this._store.stepByKey(key);
  }

  /** Focuses Track unless Slider is disabled or detached. */
  override focus(): void {
    if (this.coordinationReleased || this._store.state.disabled) return;
    super.focus();
    this._store.setFocused(this._focused);
  }

  /** Blurs Track and reflects actual focus. */
  override blur(): void {
    super.blur();
    this._store.setFocused(false);
  }

  /** Gates native pointer handling through Slider policy. */
  override processMouseEvent(event: MouseEvent): void {
    if (this.coordinationReleased) return;
    const blocked = this._store.state.disabled || this._store.state.readOnly;
    if (event.type === "down") {
      if (blocked || event.defaultPrevented || event.button !== 0) return;
      if (!this._store.startPointer()) return;
      this.nativeGestureActive = true;
      this.focus();
      this._ctx.clearSelection();
    } else if (event.type === "drag") {
      if (blocked || !this.nativeGestureActive) return;
      this._store.markPointerDragging();
    } else if (
      event.type !== "up" &&
      event.type !== "drag-end" &&
      (blocked || !this.nativeGestureActive)
    ) {
      return;
    }

    if (blocked && this.nativeGestureActive) {
      if (event.type === "up") {
        this.syncingNativeValue = true;
        super.processMouseEvent(event);
        this.syncingNativeValue = false;
        this.nativeGestureActive = false;
        this.syncFromStore(true);
        if (this._store.state.disabled && this._focused) super.blur();
      }
      return;
    }

    super.processMouseEvent(event);
    if (event.type === "up" && this.nativeGestureActive) {
      this._store.finishPointer();
      this.nativeGestureActive = false;
      this.syncFromStore(true);
    }
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently releases Track coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.unsubscribe();
    this.detachPart();
    this.nativeGestureActive = false;
    this._store.cancelPointer();
    this._focusable = false;
    if (this._focused) super.blur();
    this._store.setFocused(false);
  }

  /** Releases Track coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }

  private syncFromStore(force: boolean): void {
    const state = this._store.state;
    if (state.disabled && this._focused) super.blur();
    this._focusable = !state.disabled;
    // OpenTUI declares orientation readonly, but its pointer and render paths
    // read this public field dynamically. Reflect preserves Track identity when
    // the Root orientation prop changes.
    if (!Reflect.set(this, "orientation", state.orientation)) {
      throw new Error("Slider.Track could not synchronize native orientation");
    }
    if (this.nativeGestureActive && !force) return;
    const percentage = SliderTrackRenderable.toNativePercentage(state);
    if (Object.is(this.value, percentage)) return;
    this.syncingNativeValue = true;
    this.value = percentage;
    this.syncingNativeValue = false;
  }

  private static toNativePercentage(state: SliderState): number {
    const range = state.max - state.min;
    if (range === 0) return 0;
    const percentage = ((state.value - state.min) / range) * 100;
    return state.orientation === "vertical" ? 100 - percentage : percentage;
  }
}

interface SliderPassivePartOptions extends BoxOptions {
  readonly store: SliderStore;
}

abstract class SliderPassivePartRenderable extends BoxRenderable {
  private readonly _store: SliderStore;
  private readonly detachPart: () => void;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;

  protected constructor(
    ctx: RenderContext,
    options: SliderPassivePartOptions,
    kind: "range" | "thumb",
  ) {
    const { store, ...boxOptions } = options;
    super(ctx, { ...boxOptions, focusable: false });
    this._store = store;
    this.detachPart = attachPart(store, kind, this);
    this.unsubscribe = store.subscribe(() => this.requestRender());
  }

  /** Owning Slider Store. */
  get store(): SliderStore {
    return this._store;
  }

  set store(store: SliderStore) {
    if (store !== this._store)
      throw new Error("Slider passive Part store cannot be replaced");
  }

  /** Current immutable Slider state. */
  getState(): SliderState {
    return this._store.state;
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently releases passive Part coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.unsubscribe();
    this.detachPart();
  }

  /** Releases passive Part coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

/** Native Box options for Slider Range. */
export interface SliderRangeOptions extends BoxOptions {
  /** Store owned by the matching Root. */
  readonly store: SliderStore;
}

/** Passive Range Part reflecting Slider state. */
export class SliderRangeRenderable extends SliderPassivePartRenderable {
  /** Creates a Slider Range Renderable. */
  constructor(ctx: RenderContext, options: SliderRangeOptions) {
    super(ctx, options, "range");
  }
}

/** Native Box options for Slider Thumb. */
export interface SliderThumbOptions extends BoxOptions {
  /** Store owned by the matching Root. */
  readonly store: SliderStore;
}

/** Passive Thumb Part reflecting Slider state. */
export class SliderThumbRenderable extends SliderPassivePartRenderable {
  /** Creates a Slider Thumb Renderable. */
  constructor(ctx: RenderContext, options: SliderThumbOptions) {
    super(ctx, options, "thumb");
  }
}
