import type { BoxOptions, RenderContext } from "@opentui/core";
import type {
  CheckedState,
  CheckedStore,
  CheckedStoreOptions,
} from "./checked-store";
import { PressableRenderable } from "./pressable";

type CheckedRootOptions<TStore extends CheckedStore<string>> = BoxOptions &
  CheckedStoreOptions & { store?: TStore };

interface CheckedRootConfig<TStore extends CheckedStore<string>> {
  label: string;
  createStore: (options: CheckedStoreOptions) => TStore;
}

export abstract class CheckedRootRenderable<
  TStore extends CheckedStore<string>,
> extends PressableRenderable {
  protected _store: TStore;
  private readonly _storeLabel: string;

  constructor(
    ctx: RenderContext,
    options: CheckedRootOptions<TStore> = {},
    config: CheckedRootConfig<TStore>,
  ) {
    const {
      checked,
      defaultChecked,
      disabled,
      onCheckedChange,
      store,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._storeLabel = config.label;
    this._store =
      store ??
      config.createStore({
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

  getState(): CheckedState {
    return this._store.state;
  }

  subscribe(listener: (state: CheckedState) => void): () => void {
    return this._store.subscribe(listener);
  }

  get store(): TStore {
    return this._store;
  }

  set store(store: TStore) {
    if (store !== this._store)
      throw new Error(`${this._storeLabel} store cannot be replaced`);
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
