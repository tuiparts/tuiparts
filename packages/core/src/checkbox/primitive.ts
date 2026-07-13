import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";

export interface CheckboxState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

interface CheckboxControllerOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type CheckboxStateListener = (state: CheckboxState) => void;

export class CheckboxStateController {
  private _controlled: boolean;
  private _state: CheckboxState;
  private _onCheckedChange?: (checked: boolean) => void;
  private readonly _listeners = new Set<CheckboxStateListener>();

  constructor(options: CheckboxControllerOptions = {}) {
    this._controlled = options.checked !== undefined;
    this._state = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this._onCheckedChange = options.onCheckedChange;
  }

  get state(): CheckboxState {
    return this._state;
  }

  getState(): CheckboxState {
    return this._state;
  }

  subscribe(listener: CheckboxStateListener): () => void {
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

  private update(next: Partial<CheckboxState>): void {
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

export interface CheckboxRootOptions
  extends BoxOptions,
    CheckboxControllerOptions {}

export class CheckboxRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _controller: CheckboxStateController;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: CheckboxRootOptions = {}) {
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
    this._controller = new CheckboxStateController({
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
    });
    this._unsubscribe = this._controller.subscribe(() => this.requestRender());
  }

  getState(): CheckboxState {
    return this._controller.state;
  }

  subscribe(listener: CheckboxStateListener): () => void {
    return this._controller.subscribe(listener);
  }

  protected setStateController(controller: CheckboxStateController): void {
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

export interface CheckboxIndicatorOptions extends BoxOptions {
  root: CheckboxRootRenderable;
}

interface CheckboxStateOwner {
  getState(): CheckboxState;
  subscribe(listener: CheckboxStateListener): () => void;
}

export class CheckboxIndicatorRenderable extends BoxRenderable {
  private _owner: CheckboxStateOwner;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: CheckboxIndicatorOptions) {
    const { root, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      visible: root.getState().checked,
    });
    this._owner = root;
    this._unsubscribe = root.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  getState(): CheckboxState {
    return this._owner.getState();
  }

  protected setStateOwner(owner: CheckboxStateOwner): void {
    if (this._owner === owner) return;
    this._unsubscribe?.();
    this._owner = owner;
    this.visible = owner.getState().checked;
    this._unsubscribe = owner.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
