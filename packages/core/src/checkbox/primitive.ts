import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import { ToggleStoreState } from "../internal/toggle-store";

export interface CheckboxState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

export interface CheckboxStoreOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type CheckboxStateListener = (state: CheckboxState) => void;

export class CheckboxStore {
  private readonly toggleState: ToggleStoreState;

  constructor(options: CheckboxStoreOptions = {}) {
    this.toggleState = new ToggleStoreState(options);
  }

  get state(): CheckboxState {
    return this.toggleState.state;
  }

  getState(): CheckboxState {
    return this.toggleState.state;
  }

  subscribe(listener: CheckboxStateListener): () => void {
    return this.toggleState.subscribe(listener);
  }

  requestToggle(): void {
    this.toggleState.requestToggle();
  }

  setChecked(checked: boolean | null | undefined): void {
    this.toggleState.setChecked(checked);
  }

  setDisabled(disabled: boolean): void {
    this.toggleState.setDisabled(disabled);
  }

  setFocused(focused: boolean): void {
    this.toggleState.setFocused(focused);
  }

  setOnCheckedChange(callback: ((checked: boolean) => void) | undefined): void {
    this.toggleState.setOnCheckedChange(callback);
  }
}

export interface CheckboxRootOptions extends BoxOptions, CheckboxStoreOptions {
  store?: CheckboxStore;
}

export class CheckboxRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _store: CheckboxStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: CheckboxRootOptions = {}) {
    const {
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
      store,
      ...boxOptions
    } = options;
    super(ctx, {
      ...boxOptions,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          this._store.state.disabled
        )
          return;
        this.press();
        this.focus();
      },
    });
    this._store =
      store ??
      new CheckboxStore({
        checked,
        defaultChecked,
        disabled,
        onCheckedChange,
      });
    if (store) {
      if (checked !== undefined) store.setChecked(checked);
      if (disabled !== undefined) store.setDisabled(disabled);
      if (onCheckedChange !== undefined)
        store.setOnCheckedChange(onCheckedChange);
    }
    this._focusable = !this._store.state.disabled;
    this._unsubscribe = this._store.subscribe((state) => {
      if (state.disabled && this._focused) this.blur();
      this._focusable = !state.disabled;
      this.requestRender();
    });
  }

  getState(): CheckboxState {
    return this._store.state;
  }

  subscribe(listener: CheckboxStateListener): () => void {
    return this._store.subscribe(listener);
  }

  get store(): CheckboxStore {
    return this._store;
  }

  set store(store: CheckboxStore) {
    if (store !== this._store)
      throw new Error("Checkbox.Root store cannot be replaced");
  }

  press(): void {
    if (this._isDestroyed) return;
    this._store.requestToggle();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._isDestroyed || this._store.state.disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.press();
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

  get checked(): boolean {
    return this._store.state.checked;
  }

  set checked(checked: boolean | null | undefined) {
    this._store.setChecked(checked);
  }

  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  set onCheckedChange(callback: ((checked: boolean) => void) | undefined) {
    this._store.setOnCheckedChange(callback);
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}

export interface CheckboxIndicatorOptions extends BoxOptions {
  store: CheckboxStore;
}

export class CheckboxIndicatorRenderable extends BoxRenderable {
  private _store: CheckboxStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: CheckboxIndicatorOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      visible: store.state.checked,
    });
    this._store = store;
    this._unsubscribe = store.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  getState(): CheckboxState {
    return this._store.state;
  }

  get store(): CheckboxStore {
    return this._store;
  }

  set store(store: CheckboxStore) {
    if (this._store === store) return;
    this._unsubscribe();
    this._store = store;
    this.visible = store.state.checked;
    this._unsubscribe = store.subscribe((state) => {
      this.visible = state.checked;
    });
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
