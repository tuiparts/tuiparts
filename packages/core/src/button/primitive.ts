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
  getState(): ButtonState {
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

export class ButtonRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _store: ButtonStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: ButtonOptions = {}) {
    const { disabled, onPress, store, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store ?? new ButtonStore({ disabled, onPress });
    if (store) {
      if (disabled !== undefined) store.setDisabled(disabled);
      if (onPress !== undefined) store.setOnPress(onPress);
    }
    this._focusable = !this._store.state.disabled;
    this._unsubscribe = this._store.subscribe((state) => {
      if (state.disabled && this._focused) this.blur();
      this._focusable = !state.disabled;
      this.requestRender();
    });
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

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (this._store.state.disabled) {
      event.preventDefault();
      if (this._focused) super.blur();
      return;
    }
    if (event.type === "down") {
      if (event.button !== 0) return;
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
    this._store.setDisabled(disabled ?? false);
  }

  set onPress(callback: ((details: ButtonPressDetails) => void) | undefined) {
    this._store.setOnPress(callback);
  }

  override destroy(): void {
    this._store.setFocused(false);
    this._store.setPressed(false);
    this._unsubscribe();
    super.destroy();
  }
}
