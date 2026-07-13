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

export interface ButtonOptions extends BoxOptions {
  disabled?: boolean;
  onPress?: (details: ButtonPressDetails) => void;
}

type ButtonStateListener = (state: ButtonState) => void;

export class ButtonRenderable extends BoxRenderable {
  protected override _focusable = true;

  private _state: ButtonState;
  private _onPress?: (details: ButtonPressDetails) => void;
  private readonly _listeners = new Set<ButtonStateListener>();

  constructor(ctx: RenderContext, options: ButtonOptions = {}) {
    const { disabled, onPress, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._state = Object.freeze({
      disabled: disabled ?? false,
      focused: false,
      pressed: false,
    });
    this._onPress = onPress;
  }

  getState(): ButtonState {
    return this._state;
  }

  subscribe(listener: ButtonStateListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (event.type === "down") {
      if (event.button !== 0 || this._state.disabled) return;
      if (event.defaultPrevented) {
        this.setPressed(false);
        return;
      }
      this.setPressed(true);
      return;
    }
    if (event.type === "up" && event.button === 0) {
      const shouldPress =
        this._state.pressed && !event.defaultPrevented && !this._state.disabled;
      this.setPressed(false);
      if (!shouldPress) return;
      this.focus();
      this.requestPress(Object.freeze({ button: 0, source: "pointer" }));
      return;
    }
    if (event.type === "out" || event.type === "drag-end") {
      this.setPressed(false);
    }
  }

  press(): void {
    if (this._isDestroyed) return;
    this.requestPress(Object.freeze({ source: "imperative" }));
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._isDestroyed || key.defaultPrevented || this._state.disabled)
      return false;
    if (key.name === "space") {
      this.requestPress(Object.freeze({ key: "space", source: "keyboard" }));
      return true;
    }
    if (key.name === "return" || key.name === "enter") {
      this.requestPress(Object.freeze({ key: "enter", source: "keyboard" }));
      return true;
    }
    return false;
  }

  override focus(): void {
    if (this._state.disabled) return;
    super.focus();
    this.updateState({ focused: this._focused });
  }

  override blur(): void {
    super.blur();
    this.updateState({ focused: false, pressed: false });
  }

  get disabled(): boolean {
    return this._state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    const next = disabled ?? false;
    this.updateState({
      disabled: next,
      ...(next ? { focused: false, pressed: false } : {}),
    });
    if (next && this._focused) super.blur();
  }

  set onPress(callback: ((details: ButtonPressDetails) => void) | undefined) {
    this._onPress = callback;
  }

  override destroy(): void {
    this.updateState({ focused: false, pressed: false });
    this._listeners.clear();
    super.destroy();
  }

  private requestPress(details: ButtonPressDetails): void {
    if (this._state.disabled) return;
    this._onPress?.(Object.freeze({ ...details }) as ButtonPressDetails);
  }

  private setPressed(pressed: boolean): void {
    if (this._state.disabled && pressed) return;
    this.updateState({ pressed });
  }

  private updateState(next: Partial<ButtonState>): void {
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
    this.requestRender();
  }
}
