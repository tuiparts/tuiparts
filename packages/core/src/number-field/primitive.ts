import {
  type BaseRenderable,
  type BoxOptions,
  BoxRenderable,
  InputRenderableEvents,
  type InputRenderableOptions,
  type KeyEvent,
  type MouseEvent,
  InputRenderable as OpenTuiInputRenderable,
  type RenderContext,
} from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";

/** Keyboard commands that change a NumberField value. */
export type NumberFieldStepKey =
  | "down"
  | "end"
  | "home"
  | "pagedown"
  | "pageup"
  | "up";

/** Semantic cause of a NumberField value request. */
export type NumberFieldChangeReason =
  | "decrement"
  | "increment"
  | "input"
  | "input-clear"
  | "input-commit"
  | "keyboard"
  | "scrub";

/** Immutable terminal details for one NumberField value request or commit. */
export interface NumberFieldChangeDetails {
  /** Primary pointer button for pointer-produced requests. */
  readonly button?: 0;
  /** Horizontal terminal-cell displacement for scrubbing. */
  readonly delta?: number;
  /** Claimed key for keyboard stepping. */
  readonly key?: NumberFieldStepKey | "enter" | "space";
  /** NumberField operation that produced the request. */
  readonly reason: NumberFieldChangeReason;
  /** Terminal interaction source. */
  readonly source: "imperative" | "input" | "keyboard" | "pointer";
}

/** Readonly observable NumberField state. */
export interface NumberFieldState {
  /** Whether every mutation and focus seam is disabled. */
  readonly disabled: boolean;
  /** Current editable text shown by Input. */
  readonly inputValue: string;
  /** Whether Input currently owns actual OpenTUI focus. */
  readonly focused: boolean;
  /** Whether editing is blocked while focus remains available. */
  readonly readOnly: boolean;
  /** Whether ScrubArea owns an active pointer gesture. */
  readonly scrubbing: boolean;
  /** Current committed numeric value. */
  readonly value: number | null;
}

/** Readonly state for Increment or Decrement. */
export interface NumberFieldStepState {
  /** Whether this step action is currently unavailable. */
  readonly disabled: boolean;
}

/** Callback invoked for one accepted NumberField value request. */
export type NumberFieldValueChangeHandler = (
  value: number | null,
  details: NumberFieldChangeDetails,
) => void;

/** Callback invoked when one NumberField interaction commits. */
export type NumberFieldValueCommitHandler = (
  value: number | null,
  details: NumberFieldChangeDetails,
) => void;

/** Options used to construct a NumberField Store. */
export interface NumberFieldStoreOptions {
  /** Initial uncontrolled numeric value. */
  readonly defaultValue?: number | null;
  /** Whether every focus and mutation seam is disabled. */
  readonly disabled?: boolean;
  /** Large keyboard step; defaults to 10. */
  readonly largeStep?: number;
  /** Inclusive maximum value. */
  readonly max?: number;
  /** Inclusive minimum value. */
  readonly min?: number;
  /** Callback for accepted value requests. */
  readonly onValueChange?: NumberFieldValueChangeHandler;
  /** Callback for completed interactions. */
  readonly onValueCommit?: NumberFieldValueCommitHandler;
  /** Whether editing and mutation are blocked while focus remains available. */
  readonly readOnly?: boolean;
  /** Small keyboard step; defaults to 0.1. */
  readonly smallStep?: number;
  /** Normal step and scrub amount per terminal cell; defaults to 1. */
  readonly step?: number;
  /** Controlled numeric value. */
  readonly value?: number | null;
}

type NumberFieldStateListener = (state: NumberFieldState) => void;
type NumberFieldPartKind = "decrement" | "increment" | "input" | "scrub-area";

interface NumberFieldOwnership {
  readonly parts: Map<NumberFieldPartKind, object>;
  root?: object;
}

const ownershipByStore = new WeakMap<object, NumberFieldOwnership>();

function getOwnership(store: object): NumberFieldOwnership {
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
    throw new Error(
      "NumberField Store may be adopted by only one live NumberField.Root",
    );
  }
  ownership.root = owner;
}

function detachRoot(store: object, owner: object): void {
  const ownership = getOwnership(store);
  if (ownership.root === owner) ownership.root = undefined;
}

function attachPart(
  store: object,
  kind: NumberFieldPartKind,
  owner: object,
): () => void {
  const ownership = getOwnership(store);
  const current = ownership.parts.get(kind);
  if (current && current !== owner) {
    throw new Error(`NumberField.Root may contain only one live ${kind}`);
  }
  ownership.parts.set(kind, owner);
  return () => {
    if (ownership.parts.get(kind) === owner) ownership.parts.delete(kind);
  };
}

const INPUT_DETAILS = Object.freeze<NumberFieldChangeDetails>({
  reason: "input",
  source: "input",
});
const INPUT_CLEAR_DETAILS = Object.freeze<NumberFieldChangeDetails>({
  reason: "input-clear",
  source: "input",
});
const INPUT_COMMIT_DETAILS = Object.freeze<NumberFieldChangeDetails>({
  reason: "input-commit",
  source: "input",
});
const ENABLED_STEP_STATE = Object.freeze<NumberFieldStepState>({
  disabled: false,
});
const DISABLED_STEP_STATE = Object.freeze<NumberFieldStepState>({
  disabled: true,
});

function getStepState(disabled: boolean): NumberFieldStepState {
  return disabled ? DISABLED_STEP_STATE : ENABLED_STEP_STATE;
}

function assertFiniteOption(name: string, value: number | undefined): void {
  if (value !== undefined && !Number.isFinite(value)) {
    throw new Error(`NumberField ${name} must be finite`);
  }
}

function assertPositiveStep(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`NumberField ${name} must be a positive finite number`);
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
  if (!Number.isFinite(value) || !Number.isFinite(delta)) return value + delta;
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

function formatValue(value: number | null): string {
  if (value === null) return "";
  if (Object.is(value, -0)) return "0";
  const text = value.toString().toLowerCase();
  if (!text.includes("e")) return text;
  const [coefficient = text, exponentText = "0"] = text.split("e");
  const sign = coefficient.startsWith("-") ? "-" : "";
  const unsigned = coefficient.replace(/^[+-]/, "");
  const [integer = "0", fraction = ""] = unsigned.split(".");
  const digits = `${integer}${fraction}`;
  const decimalIndex = integer.length + Number(exponentText);
  if (decimalIndex <= 0) {
    return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  }
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

function isNumericDraft(text: string): boolean {
  return /^[+-]?(?:\d*(?:\.\d*)?)?$/.test(text);
}

function parseCompleteDecimal(text: string): number | undefined {
  if (!/^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** Framework-neutral numeric value, draft, step, and commit owner. */
export class NumberFieldStore {
  private snapshot: NumberFieldState;
  private controlled: boolean;
  private _step: number;
  private _smallStep: number;
  private _largeStep: number;
  private _min?: number;
  private _max?: number;
  private inputDirty = false;
  private readonly listeners = new Set<NumberFieldStateListener>();
  private onValueChangeCallback?: NumberFieldValueChangeHandler;
  private onValueCommitCallback?: NumberFieldValueCommitHandler;
  private mutating = false;
  private readonly mutationQueue: Array<() => void> = [];
  private scrubInitialValue = 0;
  private scrubLastRequested?: number;
  private scrubLastDelta = 0;

  /** Creates a NumberField Store. */
  constructor(options: NumberFieldStoreOptions = {}) {
    assertFiniteOption("min", options.min);
    assertFiniteOption("max", options.max);
    if (
      options.min !== undefined &&
      options.max !== undefined &&
      options.min > options.max
    ) {
      throw new Error("NumberField min cannot exceed max");
    }
    this._step = options.step ?? 1;
    this._smallStep = options.smallStep ?? 0.1;
    this._largeStep = options.largeStep ?? 10;
    assertPositiveStep("step", this._step);
    assertPositiveStep("smallStep", this._smallStep);
    assertPositiveStep("largeStep", this._largeStep);
    this._min = options.min;
    this._max = options.max;
    this.controlled = options.value !== undefined;
    const initial = this.normalizeExternal(
      options.value !== undefined
        ? options.value
        : (options.defaultValue ?? null),
    );
    this.snapshot = Object.freeze({
      disabled: options.disabled ?? false,
      focused: false,
      inputValue: formatValue(initial),
      readOnly: options.readOnly ?? false,
      scrubbing: false,
      value: initial,
    });
    this.onValueChangeCallback = options.onValueChange;
    this.onValueCommitCallback = options.onValueCommit;
  }

  /** Current immutable NumberField state. */
  get state(): NumberFieldState {
    return this.snapshot;
  }

  /** Normal step amount. */
  get step(): number {
    return this._step;
  }

  /** Small modifier step amount. */
  get smallStep(): number {
    return this._smallStep;
  }

  /** Large modifier step amount. */
  get largeStep(): number {
    return this._largeStep;
  }

  /** Inclusive minimum value. */
  get min(): number | undefined {
    return this._min;
  }

  /** Inclusive maximum value. */
  get max(): number | undefined {
    return this._max;
  }

  /** Subscribes to state changes. */
  subscribe(listener: NumberFieldStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Applies a controlled value or releases control at the observed value. */
  setValue(value: number | null | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this.controlled = false;
        return;
      }
      this.controlled = true;
      const normalized = this.normalizeExternal(value);
      const draft = parseCompleteDecimal(this.snapshot.inputValue);
      const preserveDraft =
        this.snapshot.focused && draft !== undefined && draft === normalized;
      this.update({
        inputValue: preserveDraft
          ? this.snapshot.inputValue
          : formatValue(normalized),
        value: normalized,
      });
      if (!preserveDraft) this.inputDirty = false;
    });
  }

  /** Updates global disablement. */
  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled && this.snapshot.scrubbing) this.resetScrub();
      this.update({
        disabled,
        focused: disabled ? false : this.snapshot.focused,
      });
    });
  }

  /** Updates read-only ownership. */
  setReadOnly(readOnly: boolean): void {
    this.runMutation(() => {
      if (readOnly && this.snapshot.scrubbing) this.resetScrub();
      this.update({ readOnly });
    });
  }

  /** Updates the normal step. */
  setStep(step: number): void {
    assertPositiveStep("step", step);
    this._step = step;
  }

  /** Updates the small step. */
  setSmallStep(step: number): void {
    assertPositiveStep("smallStep", step);
    this._smallStep = step;
  }

  /** Updates the large step. */
  setLargeStep(step: number): void {
    assertPositiveStep("largeStep", step);
    this._largeStep = step;
  }

  /** Updates the inclusive minimum. */
  setMin(min: number | undefined): void {
    this.setBounds(min, this._max);
  }

  /** Updates the inclusive maximum. */
  setMax(max: number | undefined): void {
    this.setBounds(this._min, max);
  }

  /** Atomically updates both inclusive bounds. */
  setBounds(min: number | undefined, max: number | undefined): void {
    assertFiniteOption("min", min);
    assertFiniteOption("max", max);
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error("NumberField min cannot exceed max");
    }
    this.runMutation(() => {
      if (Object.is(min, this._min) && Object.is(max, this._max)) return;
      this._min = min;
      this._max = max;
      this.repairBounds();
    });
  }

  /** Replaces the value-change callback. */
  setOnValueChange(callback: NumberFieldValueChangeHandler | undefined): void {
    this.onValueChangeCallback = callback;
  }

  /** Replaces the value-commit callback. */
  setOnValueCommit(callback: NumberFieldValueCommitHandler | undefined): void {
    this.onValueCommitCallback = callback;
  }

  /** Updates actual Input focus state. */
  setFocused(focused: boolean): void {
    if (this.snapshot.disabled && focused) return;
    this.runMutation(() => this.update({ focused }));
  }

  /** Accepts one native Input draft update. */
  editInput(inputValue: string): boolean {
    if (
      this.snapshot.disabled ||
      this.snapshot.readOnly ||
      !isNumericDraft(inputValue)
    )
      return false;
    this.runMutation(() => {
      this.inputDirty = true;
      let requested: number | null | undefined;
      let details: NumberFieldChangeDetails | undefined;
      if (inputValue === "") {
        requested = null;
        details = INPUT_CLEAR_DETAILS;
      } else {
        const parsed = parseCompleteDecimal(inputValue);
        if (parsed !== undefined && this.inBounds(parsed)) {
          requested = parsed;
          details = INPUT_DETAILS;
        }
      }
      if (
        requested === undefined ||
        Object.is(requested, this.snapshot.value)
      ) {
        this.update({ inputValue });
        return;
      }
      if (!this.controlled) this.update({ inputValue, value: requested });
      else this.update({ inputValue });
      this.onValueChangeCallback?.(requested, details ?? INPUT_DETAILS);
    });
    return true;
  }

  /** Commits or repairs the current Input draft. */
  commitInput(key?: "enter"): void {
    if (!this.inputDirty || this.snapshot.disabled || this.snapshot.readOnly)
      return;
    this.runMutation(() => {
      this.inputDirty = false;
      const parsed =
        this.snapshot.inputValue === ""
          ? null
          : parseCompleteDecimal(this.snapshot.inputValue);
      const requested =
        parsed === undefined
          ? this.snapshot.value
          : parsed === null
            ? null
            : this.clamp(parsed);
      const details = Object.freeze<NumberFieldChangeDetails>({
        ...INPUT_COMMIT_DETAILS,
        key,
      });
      const changed = !Object.is(requested, this.snapshot.value);
      if (changed) {
        if (!this.controlled) this.update({ value: requested });
        this.onValueChangeCallback?.(requested, details);
      }
      const observed = this.controlled ? this.snapshot.value : requested;
      this.update({ inputValue: formatValue(observed) });
      this.onValueCommitCallback?.(requested, details);
    });
  }

  /** Requests one keyboard step or finite bound. */
  stepByKey(key: KeyEvent): boolean {
    if (this.snapshot.disabled || this.snapshot.readOnly) return false;
    let requested: number | undefined;
    let keyName: NumberFieldStepKey | undefined;
    if (key.name === "home" && this._min !== undefined) {
      requested = this._min;
      keyName = "home";
    } else if (key.name === "end" && this._max !== undefined) {
      requested = this._max;
      keyName = "end";
    } else {
      const direction =
        key.name === "up" || key.name === "pageup"
          ? 1
          : key.name === "down" || key.name === "pagedown"
            ? -1
            : 0;
      if (direction === 0) return false;
      keyName =
        key.name === "up"
          ? "up"
          : key.name === "down"
            ? "down"
            : key.name === "pageup"
              ? "pageup"
              : "pagedown";
      const amount =
        key.name === "pageup" || key.name === "pagedown" || key.shift
          ? this._largeStep
          : key.option
            ? this._smallStep
            : this._step;
      requested = this.clamp(
        addDecimal(this.snapshot.value ?? 0, direction * amount),
      );
    }
    const details = Object.freeze<NumberFieldChangeDetails>({
      key: keyName,
      reason: "keyboard",
      source: "keyboard",
    });
    this.requestAndCommit(requested, details);
    return true;
  }

  /** Requests one Increment or Decrement action. */
  stepByPress(direction: 1 | -1, press: PressDetails): void {
    if (this.isStepDisabled(direction)) return;
    const reason = direction === 1 ? "increment" : "decrement";
    const details = Object.freeze<NumberFieldChangeDetails>({
      ...press,
      reason,
    });
    const requested = this.clamp(
      addDecimal(this.snapshot.value ?? 0, direction * this._step),
    );
    this.requestAndCommit(requested, details);
  }

  /** Whether one step direction is unavailable. */
  isStepDisabled(direction: 1 | -1): boolean {
    if (this.snapshot.disabled || this.snapshot.readOnly) return true;
    if (direction === 1 && this._max !== undefined) {
      return this.snapshot.value !== null && this.snapshot.value >= this._max;
    }
    if (direction === -1 && this._min !== undefined) {
      return this.snapshot.value !== null && this.snapshot.value <= this._min;
    }
    return false;
  }

  /** Starts one ScrubArea gesture. */
  startScrub(): boolean {
    if (
      this.snapshot.disabled ||
      this.snapshot.readOnly ||
      this.snapshot.scrubbing
    )
      return false;
    this.runMutation(() => {
      this.scrubInitialValue = this.snapshot.value ?? 0;
      this.scrubLastRequested = undefined;
      this.scrubLastDelta = 0;
      this.update({ scrubbing: true });
    });
    return true;
  }

  /** Applies one absolute horizontal scrub displacement. */
  scrub(delta: number): void {
    if (!Number.isInteger(delta)) return;
    this.runMutation(() => {
      if (!this.snapshot.scrubbing || delta === this.scrubLastDelta) return;
      this.scrubLastDelta = delta;
      const requested = this.clamp(
        addDecimal(this.scrubInitialValue, delta * this._step),
      );
      if (Object.is(requested, this.scrubLastRequested)) return;
      this.scrubLastRequested = requested;
      const details = Object.freeze<NumberFieldChangeDetails>({
        button: 0,
        delta,
        reason: "scrub",
        source: "pointer",
      });
      this.requestValue(requested, details, true);
    });
  }

  /** Finishes one ScrubArea gesture and commits a moved request once. */
  finishScrub(): void {
    if (!this.snapshot.scrubbing) return;
    this.runMutation(() => {
      const requested = this.scrubLastRequested;
      const delta = this.scrubLastDelta;
      this.resetScrub();
      if (requested === undefined || delta === 0) return;
      const details = Object.freeze<NumberFieldChangeDetails>({
        button: 0,
        delta,
        reason: "scrub",
        source: "pointer",
      });
      this.onValueCommitCallback?.(requested, details);
    });
  }

  /** Cancels an active ScrubArea gesture without committing. */
  cancelScrub(): void {
    if (!this.snapshot.scrubbing) return;
    this.runMutation(() => this.resetScrub());
  }

  private requestAndCommit(
    requested: number,
    details: NumberFieldChangeDetails,
  ): void {
    this.runMutation(() => {
      if (this.requestValue(requested, details, false)) {
        this.onValueCommitCallback?.(requested, details);
      }
    });
  }

  private requestValue(
    requested: number | null,
    details: NumberFieldChangeDetails,
    preserveScrub: boolean,
  ): boolean {
    if (
      this.snapshot.disabled ||
      this.snapshot.readOnly ||
      Object.is(requested, this.snapshot.value)
    )
      return false;
    if (!this.controlled) {
      this.update({ inputValue: formatValue(requested), value: requested });
    }
    this.inputDirty = false;
    this.onValueChangeCallback?.(requested, details);
    if (this.controlled && !preserveScrub) {
      this.update({ inputValue: formatValue(this.snapshot.value) });
    }
    return true;
  }

  private repairBounds(): void {
    if (this.snapshot.value !== null) {
      const value = this.clamp(this.snapshot.value);
      if (!Object.is(value, this.snapshot.value)) {
        this.update({ inputValue: formatValue(value), value });
        return;
      }
    }
    this.refresh();
  }

  private normalizeExternal(value: number | null): number | null {
    if (value === null) return null;
    if (!Number.isFinite(value)) {
      throw new Error("NumberField value must be finite or null");
    }
    return this.clamp(value);
  }

  private clamp(value: number): number {
    if (value === Infinity) return this._max ?? Number.MAX_VALUE;
    if (value === -Infinity) return this._min ?? -Number.MAX_VALUE;
    return Math.max(
      this._min ?? -Infinity,
      Math.min(this._max ?? Infinity, value),
    );
  }

  private inBounds(value: number): boolean {
    return (
      value >= (this._min ?? -Infinity) && value <= (this._max ?? Infinity)
    );
  }

  private resetScrub(): void {
    this.scrubLastRequested = undefined;
    this.scrubLastDelta = 0;
    this.update({ scrubbing: false });
  }

  private refresh(): void {
    this.snapshot = Object.freeze({ ...this.snapshot });
    this.notify();
  }

  private update(next: Partial<NumberFieldState>): void {
    const state = { ...this.snapshot, ...next };
    if (
      state.disabled === this.snapshot.disabled &&
      state.focused === this.snapshot.focused &&
      state.inputValue === this.snapshot.inputValue &&
      state.readOnly === this.snapshot.readOnly &&
      state.scrubbing === this.snapshot.scrubbing &&
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

/** Native Box options plus NumberField Root behavior props. */
export interface NumberFieldRootOptions
  extends BoxOptions,
    NumberFieldStoreOptions {
  /** Existing Store for imperative composition. */
  store?: NumberFieldStore;
}

/** Non-focusable owner for one NumberField composition. */
export class NumberFieldRootRenderable extends BoxRenderable {
  protected override _focusable = false;
  private readonly _store: NumberFieldStore;
  private readonly storeOwner: object;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;

  /** Creates a NumberField Root Renderable. */
  constructor(ctx: RenderContext, options: NumberFieldRootOptions = {}) {
    const {
      defaultValue,
      disabled,
      largeStep,
      max,
      min,
      onValueChange,
      onValueCommit,
      readOnly,
      smallStep,
      step,
      store,
      value,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._store =
      store ??
      new NumberFieldStore({
        defaultValue,
        disabled,
        largeStep,
        max,
        min,
        onValueChange,
        onValueCommit,
        readOnly,
        smallStep,
        step,
        value,
      });
    this.storeOwner = {};
    attachRoot(this._store, this.storeOwner);
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (largeStep !== undefined) store.setLargeStep(largeStep);
      if (min !== undefined || max !== undefined) {
        store.setBounds(min ?? store.min, max ?? store.max);
      }
      if (onValueChange !== undefined) store.setOnValueChange(onValueChange);
      if (onValueCommit !== undefined) store.setOnValueCommit(onValueCommit);
      if (readOnly !== undefined) store.setReadOnly(readOnly);
      if (smallStep !== undefined) store.setSmallStep(smallStep);
      if (step !== undefined) store.setStep(step);
      if (value !== undefined) store.setValue(value);
    }
    this.unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  /** Store owned or adopted by this Root. */
  get store(): NumberFieldStore {
    return this._store;
  }

  set store(store: NumberFieldStore) {
    if (store !== this._store)
      throw new Error("NumberField.Root store cannot be replaced");
  }

  /** Current immutable NumberField state. */
  getState(): NumberFieldState {
    return this._store.state;
  }

  /** Current numeric value. */
  get value(): number | null {
    return this._store.state.value;
  }

  set value(value: number | null | undefined) {
    this._store.setValue(value);
  }

  /** Whether every interaction seam is disabled. */
  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  /** Whether editing is read-only. */
  get readOnly(): boolean {
    return this._store.state.readOnly;
  }

  set readOnly(readOnly: boolean | null | undefined) {
    this._store.setReadOnly(readOnly ?? false);
  }

  /** Normal step amount. */
  get step(): number {
    return this._store.step;
  }

  set step(step: number | null | undefined) {
    this._store.setStep(step ?? 1);
  }

  /** Small modifier step amount. */
  get smallStep(): number {
    return this._store.smallStep;
  }

  set smallStep(step: number | null | undefined) {
    this._store.setSmallStep(step ?? 0.1);
  }

  /** Large modifier step amount. */
  get largeStep(): number {
    return this._store.largeStep;
  }

  set largeStep(step: number | null | undefined) {
    this._store.setLargeStep(step ?? 10);
  }

  /** Inclusive minimum. */
  get min(): number | undefined {
    return this._store.min;
  }

  set min(min: number | null | undefined) {
    this._store.setMin(min ?? undefined);
  }

  /** Inclusive maximum. */
  get max(): number | undefined {
    return this._store.max;
  }

  set max(max: number | null | undefined) {
    this._store.setMax(max ?? undefined);
  }

  /** Replaces the value-change callback. */
  set onValueChange(callback: NumberFieldValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  /** Replaces the value-commit callback. */
  set onValueCommit(callback: NumberFieldValueCommitHandler | undefined) {
    this._store.setOnValueCommit(callback);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently ends this Root and every same-Store descendant Part. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    const visit = (node: BaseRenderable): void => {
      for (const child of node.getChildren()) {
        if (
          (child instanceof NumberFieldInputRenderable ||
            child instanceof NumberFieldIncrementRenderable ||
            child instanceof NumberFieldDecrementRenderable ||
            child instanceof NumberFieldScrubAreaRenderable) &&
          child.store === this._store
        ) {
          child.endCoordinationLifetime();
        }
        visit(child);
      }
    };
    visit(this);
    this.unsubscribe();
    this._store.cancelScrub();
    detachRoot(this._store, this.storeOwner);
  }

  /** Releases Root and descendant coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

/** Native Input options reserved around NumberField coordination. */
export interface NumberFieldInputOptions
  extends Omit<InputRenderableOptions, "value"> {
  /** Store owned by the matching Root. */
  store: NumberFieldStore;
}

/** OpenTUI-native single-line editor coordinated by NumberField. */
export class NumberFieldInputRenderable extends OpenTuiInputRenderable {
  private readonly _store: NumberFieldStore;
  private readonly detachPart: () => void;
  private readonly unsubscribe: () => void;
  private coordinationReleased = false;
  private synchronizing = false;

  /** Creates a NumberField Input Renderable. */
  constructor(ctx: RenderContext, options: NumberFieldInputOptions) {
    const { store, ...inputOptions } = options;
    super(ctx, { ...inputOptions, value: store.state.inputValue });
    this._store = store;
    this.detachPart = attachPart(store, "input", this);
    this.traits = {
      ...this.traits,
      suspend: store.state.disabled || store.state.readOnly,
    };
    this._focusable = !store.state.disabled;
    this.on(InputRenderableEvents.INPUT, (value) => {
      if (!this.synchronizing && !store.editInput(value)) {
        this.syncValue(store.state.inputValue);
      }
    });
    this.unsubscribe = store.subscribe((state) => {
      this.traits = {
        ...this.traits,
        suspend: state.disabled || state.readOnly,
      };
      if (state.disabled && this._focused) this.blur();
      this._focusable = !state.disabled;
      this.syncValue(state.inputValue);
      this.requestRender();
    });
  }

  /** Owning NumberField Store. */
  get store(): NumberFieldStore {
    return this._store;
  }

  set store(store: NumberFieldStore) {
    if (store !== this._store)
      throw new Error("NumberField.Input store cannot be replaced");
  }

  /** Current immutable NumberField state. */
  getState(): NumberFieldState {
    return this._store.state;
  }

  /** Handles numeric step keys before native Input editing keys. */
  override handleKeyPress(key: KeyEvent): boolean {
    if (this.coordinationReleased || this._store.state.disabled) return false;
    if (this._store.stepByKey(key)) return true;
    return super.handleKeyPress(key);
  }

  /** Inserts text only when the resulting plain-text draft remains numeric. */
  override insertText(text: string): void {
    if (
      this.coordinationReleased ||
      this._store.state.disabled ||
      this._store.state.readOnly
    )
      return;
    const sanitized = text.replace(/[\n\r]/g, "");
    if (!sanitized) return;
    const selection = this.getSelection();
    const start = selection?.start ?? this.cursorOffset;
    const end = selection?.end ?? this.cursorOffset;
    const candidate =
      this.value.slice(0, start) + sanitized + this.value.slice(end);
    if (!isNumericDraft(candidate)) return;
    super.insertText(sanitized);
  }

  /** Focuses the native editor unless Root is disabled or detached. */
  override focus(): void {
    if (this.coordinationReleased || this._store.state.disabled) return;
    super.focus();
    this._store.setFocused(this._focused);
  }

  /** Blurs the native editor and commits a dirty numeric draft. */
  override blur(): void {
    const wasFocused = this._focused;
    super.blur();
    this._store.setFocused(false);
    if (wasFocused) this._store.commitInput();
  }

  /** Commits the draft and submits through the native Input event seam. */
  override submit(): boolean {
    if (this.coordinationReleased || this._store.state.disabled) return false;
    this._store.commitInput("enter");
    return super.submit();
  }

  private syncValue(value: string): void {
    if (this.value === value) return;
    this.synchronizing = true;
    this.value = value;
    this.synchronizing = false;
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently releases Input coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.unsubscribe();
    this.detachPart();
    this._focusable = false;
    if (this._focused) super.blur();
    this._store.setFocused(false);
  }

  /** Releases Input coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

interface NumberFieldStepOptions extends BoxOptions {
  store: NumberFieldStore;
}

abstract class NumberFieldStepRenderable extends PressableRenderable {
  private readonly _store: NumberFieldStore;
  private readonly detachPart: () => void;
  private coordinationReleased = false;

  protected constructor(
    ctx: RenderContext,
    options: NumberFieldStepOptions,
    private readonly direction: 1 | -1,
    kind: "increment" | "decrement",
  ) {
    const { store, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    this.detachPart = attachPart(store, kind, this);
    const owner = this;
    this.attachPressable({
      get state() {
        return { disabled: store.isStepDisabled(owner.direction) };
      },
      subscribe(listener) {
        return store.subscribe(listener);
      },
    });
  }

  /** Owning NumberField Store. */
  get store(): NumberFieldStore {
    return this._store;
  }

  set store(store: NumberFieldStore) {
    if (store !== this._store)
      throw new Error("NumberField step store cannot be replaced");
  }

  /** Current effective step state. */
  getState(): NumberFieldStepState {
    return getStepState(this._store.isStepDisabled(this.direction));
  }

  protected handlePress(details: PressDetails): void {
    if (this.coordinationReleased) return;
    this._store.stepByPress(this.direction, details);
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently releases step coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.detachPressable();
    this.detachPart();
    this._focusable = false;
    if (this._focused) super.blur();
  }

  /** Releases step coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}

/** Native Box options for NumberField Increment. */
export interface NumberFieldIncrementOptions extends BoxOptions {
  /** Store owned by the matching Root. */
  store: NumberFieldStore;
}

/** Pressable Part that requests one positive normal step. */
export class NumberFieldIncrementRenderable extends NumberFieldStepRenderable {
  /** Creates a NumberField Increment Renderable. */
  constructor(ctx: RenderContext, options: NumberFieldIncrementOptions) {
    super(ctx, options, 1, "increment");
  }
}

/** Native Box options for NumberField Decrement. */
export interface NumberFieldDecrementOptions extends BoxOptions {
  /** Store owned by the matching Root. */
  store: NumberFieldStore;
}

/** Pressable Part that requests one negative normal step. */
export class NumberFieldDecrementRenderable extends NumberFieldStepRenderable {
  /** Creates a NumberField Decrement Renderable. */
  constructor(ctx: RenderContext, options: NumberFieldDecrementOptions) {
    super(ctx, options, -1, "decrement");
  }
}

/** Native Box options for NumberField ScrubArea. */
export interface NumberFieldScrubAreaOptions extends BoxOptions {
  /** Store owned by the matching Root. */
  store: NumberFieldStore;
}

/** Pointer-drag Part that maps horizontal terminal cells to normal steps. */
export class NumberFieldScrubAreaRenderable extends BoxRenderable {
  private readonly _store: NumberFieldStore;
  private readonly detachPart: () => void;
  private coordinationReleased = false;
  private originX?: number;

  /** Creates a NumberField ScrubArea Renderable. */
  constructor(ctx: RenderContext, options: NumberFieldScrubAreaOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, { ...boxOptions, focusable: false });
    this._store = store;
    this.detachPart = attachPart(store, "scrub-area", this);
  }

  /** Owning NumberField Store. */
  get store(): NumberFieldStore {
    return this._store;
  }

  set store(store: NumberFieldStore) {
    if (store !== this._store)
      throw new Error("NumberField.ScrubArea store cannot be replaced");
  }

  /** Current immutable NumberField state. */
  getState(): NumberFieldState {
    return this._store.state;
  }

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (this.coordinationReleased) return;
    if (event.type === "down" && event.button === 0) {
      if (event.defaultPrevented || !this._store.startScrub()) return;
      this.originX = event.x;
      this._ctx.clearSelection();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.type === "drag" && this.originX !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      this._store.scrub(event.x - this.originX);
      return;
    }
    if (
      (event.type === "drag-end" || event.type === "up") &&
      this.originX !== undefined
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.originX = undefined;
      this._store.finishScrub();
    }
  }

  protected override onRemove(): void {
    this.endCoordinationLifetime();
    super.onRemove();
  }

  /** Permanently releases ScrubArea coordination. */
  endCoordinationLifetime(): void {
    if (this.coordinationReleased) return;
    this.coordinationReleased = true;
    this.originX = undefined;
    this._store.cancelScrub();
    this.detachPart();
  }

  /** Releases ScrubArea coordination. */
  override destroy(): void {
    this.endCoordinationLifetime();
    super.destroy();
  }
}
