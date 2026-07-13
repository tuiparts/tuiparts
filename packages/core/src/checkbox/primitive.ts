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

export interface CheckboxStoreOptions {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

type CheckboxStateListener = (state: CheckboxState) => void;

export class CheckboxStore {
  private controlled: boolean;
  private snapshot: CheckboxState;
  private onCheckedChange?: (checked: boolean) => void;
  private readonly listeners = new Set<CheckboxStateListener>();

  constructor(options: CheckboxStoreOptions = {}) {
    this.controlled = options.checked !== undefined;
    this.snapshot = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this.onCheckedChange = options.onCheckedChange;
  }

  get state(): CheckboxState {
    return this.snapshot;
  }

  getState(): CheckboxState {
    return this.snapshot;
  }

  subscribe(listener: CheckboxStateListener): () => void {
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

  private update(next: Partial<CheckboxState>): void {
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
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
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
