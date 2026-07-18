import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { CheckedStore } from "../internal/checked-store";
import { PressableRenderable } from "../internal/pressable";

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
  private readonly checkedStore: CheckedStore;

  constructor(options: CheckboxStoreOptions = {}) {
    this.checkedStore = new CheckedStore(options);
  }

  get state(): CheckboxState {
    return this.checkedStore.state;
  }

  getState(): CheckboxState {
    return this.checkedStore.state;
  }

  subscribe(listener: CheckboxStateListener): () => void {
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

export interface CheckboxRootOptions extends BoxOptions, CheckboxStoreOptions {
  store?: CheckboxStore;
}

export class CheckboxRootRenderable extends PressableRenderable {
  protected _store: CheckboxStore;

  constructor(ctx: RenderContext, options: CheckboxRootOptions = {}) {
    const {
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
      store,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
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
    this.attachPressable(this._store);
  }

  protected handlePress(): void {
    this._store.requestToggle();
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
