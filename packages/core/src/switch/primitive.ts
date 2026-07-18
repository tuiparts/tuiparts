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

export type SwitchState = CheckedState;
export type SwitchStoreOptions = CheckedStoreOptions;

export class SwitchStore extends CheckedStore<"switch"> {}

export interface SwitchRootOptions extends BoxOptions, SwitchStoreOptions {
  store?: SwitchStore;
}

export class SwitchRootRenderable extends CheckedRootRenderable<SwitchStore> {
  constructor(ctx: RenderContext, options: SwitchRootOptions = {}) {
    super(ctx, options, {
      label: "Switch.Root",
      createStore: (storeOptions) => new SwitchStore(storeOptions),
    });
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
