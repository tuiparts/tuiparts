import {
  type BoxOptions,
  BoxRenderable,
  type RenderContext,
} from "@opentui/core";
import { CheckedRootRenderable } from "../internal/checked-root";
import {
  type CheckedState,
  CheckedStore,
  type CheckedStoreOptions,
} from "../internal/checked-store";

export type CheckboxState = CheckedState;
export type CheckboxStoreOptions = CheckedStoreOptions;

export class CheckboxStore extends CheckedStore<"checkbox"> {}

export interface CheckboxRootOptions extends BoxOptions, CheckboxStoreOptions {
  store?: CheckboxStore;
}

export class CheckboxRootRenderable extends CheckedRootRenderable<CheckboxStore> {
  constructor(ctx: RenderContext, options: CheckboxRootOptions = {}) {
    super(ctx, options, {
      label: "Checkbox.Root",
      createStore: (storeOptions) => new CheckboxStore(storeOptions),
    });
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
