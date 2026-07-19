import type { BoxOptions, RenderContext } from "@opentui/core";
import { PressableRenderable, type PressDetails } from "../internal/pressable";

export type ButtonPressDetails = PressDetails;

export interface ButtonState {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly pressed: boolean;
}

export interface ButtonStoreOptions {
  disabled?: boolean;
  onPress?: (details: ButtonPressDetails) => void;
}

type ButtonStateListener = (state: ButtonState) => void;

export class ButtonStore {
  private snapshot: ButtonState;
  private onPress?: (details: ButtonPressDetails) => void;
  private readonly listeners = new Set<ButtonStateListener>();

  constructor(options: ButtonStoreOptions = {}) {
    this.snapshot = Object.freeze({
      disabled: options.disabled ?? false,
      focused: false,
      pressed: false,
    });
    this.onPress = options.onPress;
  }

  get state(): ButtonState {
    return this.snapshot;
  }
  subscribe(listener: ButtonStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  requestPress(details: ButtonPressDetails): void {
    if (this.snapshot.disabled) return;
    this.onPress?.(Object.freeze({ ...details }));
  }
  setDisabled(disabled: boolean): void {
    this.update({
      disabled,
      ...(disabled ? { focused: false, pressed: false } : {}),
    });
  }
  setFocused(focused: boolean): void {
    if (this.snapshot.disabled && focused) return;
    this.update({ focused, ...(!focused ? { pressed: false } : {}) });
  }
  setPressed(pressed: boolean): void {
    if (this.snapshot.disabled && pressed) return;
    this.update({ pressed });
  }
  setOnPress(
    callback: ((details: ButtonPressDetails) => void) | undefined,
  ): void {
    this.onPress = callback;
  }
  private update(next: Partial<ButtonState>): void {
    const state = { ...this.snapshot, ...next };
    if (
      state.disabled === this.snapshot.disabled &&
      state.focused === this.snapshot.focused &&
      state.pressed === this.snapshot.pressed
    )
      return;
    this.snapshot = Object.freeze(state);
    for (const listener of this.listeners) listener(state);
  }
}

export interface ButtonOptions extends BoxOptions, ButtonStoreOptions {
  store?: ButtonStore;
}

export class ButtonRenderable extends PressableRenderable {
  protected _store: ButtonStore;

  constructor(ctx: RenderContext, options: ButtonOptions = {}) {
    const { disabled, onPress, store, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store ?? new ButtonStore({ disabled, onPress });
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (onPress !== undefined) store.setOnPress(onPress);
    }
    this.attachPressable(this._store);
  }

  protected handlePress(details: PressDetails): void {
    this._store.requestPress(details);
  }

  protected override onPointerPressedChanged(pressed: boolean): void {
    this._store.setPressed(pressed);
  }

  getState(): ButtonState {
    return this._store.state;
  }

  subscribe(listener: ButtonStateListener): () => void {
    return this._store.subscribe(listener);
  }

  get store(): ButtonStore {
    return this._store;
  }
  set store(store: ButtonStore) {
    if (store !== this._store)
      throw new Error("Button store cannot be replaced");
  }

  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  set onPress(callback: ((details: ButtonPressDetails) => void) | undefined) {
    this._store.setOnPress(callback);
  }
}
