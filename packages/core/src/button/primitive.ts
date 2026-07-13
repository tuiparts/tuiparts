import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type MouseEvent,
  type RenderContext,
} from "@opentui/core";

export type ButtonPressDetails =
  | Readonly<{ source: "imperative" }>
  | Readonly<{ key: "enter" | "space"; source: "keyboard" }>
  | Readonly<{ button: 0; source: "pointer" }>;

export interface ButtonState {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly pressed: boolean;
}

export interface ButtonStoreOptions {
  disabled?: boolean;
  onPress?: (details: ButtonPressDetails) => void;
}

type ButtonStoreListener = (state: ButtonState) => void;

export class ButtonStore {
  private _state: ButtonState;
  private _onPress?: (details: ButtonPressDetails) => void;
  private readonly _listeners = new Set<ButtonStoreListener>();

  constructor(options: ButtonStoreOptions = {}) {
    this._state = Object.freeze({
      disabled: options.disabled ?? false,
      focused: false,
      pressed: false,
    });
    this._onPress = options.onPress;
  }

  get state(): ButtonState {
    return this._state;
  }

  subscribe(listener: ButtonStoreListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  requestPress(details: ButtonPressDetails): void {
    if (this._state.disabled) return;
    this._onPress?.(Object.freeze({ ...details }) as ButtonPressDetails);
  }

  setDisabled(disabled: boolean): void {
    this.update({
      disabled,
      ...(disabled ? { focused: false, pressed: false } : {}),
    });
  }

  setFocused(focused: boolean): void {
    if (this._state.disabled && focused) return;
    this.update({ focused, ...(!focused ? { pressed: false } : {}) });
  }

  setPressed(pressed: boolean): void {
    if (this._state.disabled && pressed) return;
    this.update({ pressed });
  }

  setOnPress(
    callback: ((details: ButtonPressDetails) => void) | undefined,
  ): void {
    this._onPress = callback;
  }

  private update(next: Partial<ButtonState>): void {
    const state = { ...this._state, ...next };
    if (
      state.disabled === this._state.disabled &&
      state.focused === this._state.focused &&
      state.pressed === this._state.pressed
    ) {
      return;
    }
    this._state = Object.freeze(state);
    for (const listener of this._listeners) listener(state);
  }
}

interface ButtonPartOptions {
  /** Shared state for composing Root with framework adapters. */
  store?: ButtonStore;
}

export interface ButtonRootOptions
  extends BoxOptions,
    ButtonStoreOptions,
    ButtonPartOptions {}

export class ButtonRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  private _store: ButtonStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: ButtonRootOptions = {}) {
    const { store, disabled, onPress, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store ?? new ButtonStore({ disabled, onPress });
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  getState(): ButtonState {
    return this._store.state;
  }

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (event.type === "down") {
      if (event.button !== 0 || this._store.state.disabled) {
        return;
      }
      if (event.defaultPrevented) {
        this._store.setPressed(false);
        return;
      }
      this._store.setPressed(true);
      return;
    }
    if (event.type === "up" && event.button === 0) {
      const shouldPress =
        this._store.state.pressed &&
        !event.defaultPrevented &&
        !this._store.state.disabled;
      this._store.setPressed(false);
      if (!shouldPress) return;
      this.focus();
      this._store.requestPress(Object.freeze({ button: 0, source: "pointer" }));
      return;
    }
    if (event.type === "out" || event.type === "drag-end") {
      this._store.setPressed(false);
    }
  }

  press(): void {
    if (this._isDestroyed) return;
    this._store.requestPress(Object.freeze({ source: "imperative" }));
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._isDestroyed || key.defaultPrevented || this._store.state.disabled)
      return false;
    if (key.name === "space") {
      this._store.requestPress(
        Object.freeze({ key: "space", source: "keyboard" }),
      );
      return true;
    }
    if (key.name === "return" || key.name === "enter") {
      this._store.requestPress(
        Object.freeze({ key: "enter", source: "keyboard" }),
      );
      return true;
    }
    return false;
  }

  override focus(): void {
    if (this._store.state.disabled) return;
    super.focus();
    this._store.setFocused(this._focused);
  }

  override blur(): void {
    super.blur();
    this._store.setFocused(false);
  }

  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    const next = disabled ?? false;
    this._store.setDisabled(next);
    if (next && this._focused) super.blur();
  }

  set onPress(callback: ((details: ButtonPressDetails) => void) | undefined) {
    this._store.setOnPress(callback);
  }

  get store(): ButtonStore {
    return this._store;
  }

  set store(store: ButtonStore) {
    if (this._store === store) return;
    this._unsubscribe?.();
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  override destroy(): void {
    this._store.setFocused(false);
    this._store.setPressed(false);
    this._unsubscribe();
    super.destroy();
  }
}
