import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";
import { CheckedStore } from "../internal/checked-store";

export interface SwitchState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

export interface SwitchStoreOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type SwitchStateListener = (state: SwitchState) => void;

export class SwitchStore {
  private readonly checkedStore: CheckedStore;

  constructor(options: SwitchStoreOptions = {}) {
    this.checkedStore = new CheckedStore(options);
  }

  get state(): SwitchState {
    return this.checkedStore.state;
  }
  getState(): SwitchState {
    return this.checkedStore.state;
  }
  subscribe(listener: SwitchStateListener): () => void {
    return this.checkedStore.subscribe(listener);
  }
  requestToggle(): void {
    this.checkedStore.requestToggle();
  }
  setChecked(checked: boolean | null | undefined): void {
    this.checkedStore.setChecked(checked);
  }
  setDisabled(disabled: boolean): void {
    this.checkedStore.setDisabled(disabled);
  }
  setFocused(focused: boolean): void {
    this.checkedStore.setFocused(focused);
  }
  setOnCheckedChange(callback: ((checked: boolean) => void) | undefined): void {
    this.checkedStore.setOnCheckedChange(callback);
  }
}

export interface SwitchRootOptions extends BoxOptions, SwitchStoreOptions {
  store?: SwitchStore;
}

export class SwitchRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  protected _store: SwitchStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchRootOptions = {}) {
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
      new SwitchStore({
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

  getState(): SwitchState {
    return this._store.state;
  }

  subscribe(listener: SwitchStateListener): () => void {
    return this._store.subscribe(listener);
  }

  get store(): SwitchStore {
    return this._store;
  }
  set store(store: SwitchStore) {
    if (store !== this._store)
      throw new Error("Switch.Root store cannot be replaced");
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

export interface SwitchThumbOptions extends BoxOptions {
  store: SwitchStore;
}

export class SwitchThumbRenderable extends BoxRenderable {
  private _store: SwitchStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchThumbOptions) {
    const { store, ...boxOptions } = options;
    super(ctx, boxOptions);
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  getState(): SwitchState {
    return this._store.state;
  }

  get store(): SwitchStore {
    return this._store;
  }

  set store(store: SwitchStore) {
    if (this._store === store) return;
    this._unsubscribe();
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
