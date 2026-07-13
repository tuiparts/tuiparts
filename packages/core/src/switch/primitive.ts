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

export interface SwitchStoreOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type SwitchStateListener = (state: SwitchState) => void;

export class SwitchStore {
  private controlled: boolean;
  private snapshot: SwitchState;
  private onCheckedChange?: (checked: boolean) => void;
  private readonly listeners = new Set<SwitchStateListener>();

  constructor(options: SwitchStoreOptions = {}) {
    this.controlled = options.checked !== undefined;
    this.snapshot = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this.onCheckedChange = options.onCheckedChange;
  }

  get state(): SwitchState {
    return this.snapshot;
  }
  getState(): SwitchState {
    return this.snapshot;
  }
  subscribe(listener: SwitchStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  requestToggle(): void {
    if (this.snapshot.disabled) return;
    const checked = !this.snapshot.checked;
    if (!this.controlled) this.update({ checked });
    this.onCheckedChange?.(checked);
  }
  setChecked(checked: boolean | null | undefined): void {
    if (typeof checked !== "boolean") {
      this.controlled = false;
      return;
    }
    this.controlled = true;
    this.update({ checked });
  }
  setDisabled(disabled: boolean): void {
    this.update({ disabled, ...(disabled ? { focused: false } : {}) });
  }
  setFocused(focused: boolean): void {
    if (this.snapshot.disabled && focused) return;
    this.update({ focused });
  }
  setOnCheckedChange(callback: ((checked: boolean) => void) | undefined): void {
    this.onCheckedChange = callback;
  }
  private update(next: Partial<SwitchState>): void {
    const state = { ...this.snapshot, ...next };
    if (
      state.checked === this.snapshot.checked &&
      state.disabled === this.snapshot.disabled &&
      state.focused === this.snapshot.focused
    )
      return;
    this.snapshot = Object.freeze(state);
    for (const listener of this.listeners) listener(state);
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
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
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
    this._store.requestToggle();
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._store.state.disabled) return false;
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
    const next = disabled ?? false;
    this._store.setDisabled(next);
    if (next && this._focused) super.blur();
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
