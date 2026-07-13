import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";

export interface SwitchState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

interface SwitchControllerOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type SwitchStateListener = (state: SwitchState) => void;

export class SwitchStateController {
  private _controlled: boolean;
  private _state: SwitchState;
  private _onCheckedChange?: (checked: boolean) => void;
  private readonly _listeners = new Set<SwitchStateListener>();

  constructor(options: SwitchControllerOptions = {}) {
    this._controlled = options.checked !== undefined;
    this._state = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this._onCheckedChange = options.onCheckedChange;
  }

  get state(): SwitchState {
    return this._state;
  }

  getState(): SwitchState {
    return this._state;
  }

  subscribe(listener: SwitchStateListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  requestToggle(): void {
    if (this._state.disabled) return;
    const checked = !this._state.checked;
    if (!this._controlled) this.update({ checked });
    this._onCheckedChange?.(checked);
  }

  setChecked(checked: boolean | null | undefined): void {
    if (typeof checked !== "boolean") {
      this._controlled = false;
      return;
    }
    this._controlled = true;
    this.update({ checked });
  }

  setDisabled(disabled: boolean): void {
    this.update({ disabled, ...(disabled ? { focused: false } : {}) });
  }

  setFocused(focused: boolean): void {
    if (this._state.disabled && focused) return;
    this.update({ focused });
  }

  setOnCheckedChange(callback: ((checked: boolean) => void) | undefined): void {
    this._onCheckedChange = callback;
  }

  private update(next: Partial<SwitchState>): void {
    const state = { ...this._state, ...next };
    if (
      state.checked === this._state.checked &&
      state.disabled === this._state.disabled &&
      state.focused === this._state.focused
    ) {
      return;
    }
    this._state = Object.freeze(state);
    for (const listener of this._listeners) listener(state);
  }
}

export interface SwitchRootOptions
  extends BoxOptions,
    SwitchControllerOptions {}

export class SwitchRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _controller: SwitchStateController;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchRootOptions = {}) {
    const {
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
      ...boxOptions
    } = options;
    super(ctx, {
      ...boxOptions,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          this._controller.state.disabled
        )
          return;
        this.press();
        this.focus();
      },
    });
    this._controller = new SwitchStateController({
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
    });
    this._unsubscribe = this._controller.subscribe(() => this.requestRender());
  }

  getState(): SwitchState {
    return this._controller.state;
  }

  subscribe(listener: SwitchStateListener): () => void {
    return this._controller.subscribe(listener);
  }

  protected setStateController(controller: SwitchStateController): void {
    if (this._controller === controller) return;
    this._unsubscribe?.();
    this._controller = controller;
    this._unsubscribe = controller.subscribe(() => this.requestRender());
  }

  press(): void {
    this._controller.requestToggle();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._controller.state.disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.press();
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

  get checked(): boolean {
    return this._controller.state.checked;
  }

  set checked(checked: boolean | null | undefined) {
    this._controller.setChecked(checked);
  }

  get disabled(): boolean {
    return this._controller.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    const next = disabled ?? false;
    this._controller.setDisabled(next);
    if (next && this._focused) super.blur();
  }

  set onCheckedChange(callback: ((checked: boolean) => void) | undefined) {
    this._controller.setOnCheckedChange(callback);
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}

export interface SwitchThumbOptions extends BoxOptions {
  root: SwitchRootRenderable;
}

interface SwitchStateOwner {
  getState(): SwitchState;
  subscribe(listener: SwitchStateListener): () => void;
}

export class SwitchThumbRenderable extends BoxRenderable {
  private _owner: SwitchStateOwner;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchThumbOptions) {
    const { root, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._owner = root;
    this._unsubscribe = root.subscribe(() => this.requestRender());
  }

  getState(): SwitchState {
    return this._owner.getState();
  }

  protected setStateOwner(owner: SwitchStateOwner): void {
    if (this._owner === owner) return;
    this._unsubscribe?.();
    this._owner = owner;
    this._unsubscribe = owner.subscribe(() => this.requestRender());
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
