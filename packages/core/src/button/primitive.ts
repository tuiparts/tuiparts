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

export class ButtonStateController {
  private _state: ButtonState;
  private _onPress?: (details: ButtonPressDetails) => void;
  private readonly _listeners = new Set<ButtonStateListener>();

  constructor(options: Pick<ButtonOptions, "disabled" | "onPress"> = {}) {
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

  subscribe(listener: ButtonStateListener): () => void {
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

export class ButtonRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _controller: ButtonStateController;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: ButtonOptions = {}) {
    const { disabled, onPress, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._controller = new ButtonStateController({ disabled, onPress });
    this._unsubscribe = this._controller.subscribe(() => this.requestRender());
  }

  getState(): ButtonState {
    return this._controller.state;
  }

  subscribe(listener: ButtonStateListener): () => void {
    return this._controller.subscribe(listener);
  }

  protected setStateController(controller: ButtonStateController): void {
    if (this._controller === controller) return;
    this._unsubscribe?.();
    this._controller = controller;
    this._unsubscribe = controller.subscribe(() => this.requestRender());
  }

  protected override onMouseEvent(event: MouseEvent): void {
    super.onMouseEvent(event);
    if (event.type === "down") {
      if (event.button !== 0 || this._controller.state.disabled) return;
      if (event.defaultPrevented) {
        this._controller.setPressed(false);
        return;
      }
      this._controller.setPressed(true);
      return;
    }
    if (event.type === "up" && event.button === 0) {
      const shouldPress =
        this._controller.state.pressed &&
        !event.defaultPrevented &&
        !this._controller.state.disabled;
      this._controller.setPressed(false);
      if (!shouldPress) return;
      this.focus();
      this._controller.requestPress(
        Object.freeze({ button: 0, source: "pointer" }),
      );
      return;
    }
    if (event.type === "out" || event.type === "drag-end") {
      this._controller.setPressed(false);
    }
  }

  press(): void {
    if (this._isDestroyed) return;
    this._controller.requestPress(Object.freeze({ source: "imperative" }));
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (
      this._isDestroyed ||
      key.defaultPrevented ||
      this._controller.state.disabled
    )
      return false;
    if (key.name === "space") {
      this._controller.requestPress(
        Object.freeze({ key: "space", source: "keyboard" }),
      );
      return true;
    }
    if (key.name === "return" || key.name === "enter") {
      this._controller.requestPress(
        Object.freeze({ key: "enter", source: "keyboard" }),
      );
      return true;
    }
    return false;
  }

  override focus(): void {
    if (this._controller.state.disabled) return;
    super.focus();
    this._controller.setFocused(this._focused);
  }

  override blur(): void {
    super.blur();
    this._controller.setFocused(false);
  }

  get disabled(): boolean {
    return this._controller.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    const next = disabled ?? false;
    this._controller.setDisabled(next);
    if (next && this._focused) super.blur();
  }

  set onPress(callback: ((details: ButtonPressDetails) => void) | undefined) {
    this._controller.setOnPress(callback);
  }

  override destroy(): void {
    this._controller.setFocused(false);
    this._controller.setPressed(false);
    this._unsubscribe();
    super.destroy();
  }
}
