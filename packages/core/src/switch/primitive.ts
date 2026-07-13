import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";

export interface SwitchPrimitiveState {
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

type SwitchStoreListener = (state: SwitchPrimitiveState) => void;

export class SwitchStore {
  private _controlled: boolean;
  private _state: SwitchPrimitiveState;
  private _onCheckedChange?: (checked: boolean) => void;
  private readonly _listeners = new Set<SwitchStoreListener>();

  constructor(options: SwitchStoreOptions = {}) {
    this._controlled = options.checked !== undefined;
    this._state = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this._onCheckedChange = options.onCheckedChange;
  }

  get state(): SwitchPrimitiveState {
    return this._state;
  }

  subscribe(listener: SwitchStoreListener): () => void {
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

  private update(next: Partial<SwitchPrimitiveState>): void {
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

interface SwitchPartOptions {
  /** Shared state for composing Root with its public parts. */
  store?: SwitchStore;
}

export interface SwitchRootOptions
  extends BoxOptions,
    SwitchStoreOptions,
    SwitchPartOptions {}

export class SwitchRootRenderable extends BoxRenderable {
  protected override _focusable = true;

  private _store: SwitchStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchRootOptions = {}) {
    const {
      store,
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
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  getState(): SwitchPrimitiveState {
    return this._store.state;
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

  get store(): SwitchStore {
    return this._store;
  }

  set store(store: SwitchStore) {
    if (this._store === store) return;
    this._unsubscribe?.();
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}

export interface SwitchThumbOptions extends BoxOptions, SwitchPartOptions {}

export class SwitchThumbRenderable extends BoxRenderable {
  private _store: SwitchStore;
  private _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: SwitchThumbOptions = {}) {
    const { store: providedStore, ...boxOptions } = options;
    const store = providedStore ?? new SwitchStore();
    super(ctx, boxOptions);
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  getState(): SwitchPrimitiveState {
    return this._store.state;
  }

  set store(store: SwitchStore) {
    if (this._store === store) return;
    this._unsubscribe?.();
    this._store = store;
    this._unsubscribe = store.subscribe(() => this.requestRender());
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
