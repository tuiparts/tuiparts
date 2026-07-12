export type RadioGroupItemKey = symbol;

export interface RadioGroupPrimitiveState {
  readonly value: string | null;
  readonly disabled: boolean;
}

export interface RadioGroupItemState {
  readonly value: string;
  readonly disabled: boolean;
  readonly selected: boolean;
}

export interface RadioGroupStoreOptions {
  value?: string | null;
  defaultValue?: string | null;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export interface RadioGroupItemOptions {
  disabled?: boolean;
}

export interface RadioGroupItemRegistration {
  readonly key: RadioGroupItemKey;
  setDisabled(disabled: boolean): void;
  setValue(value: string): void;
  unregister(): void;
}

type RadioGroupStoreListener = (state: RadioGroupPrimitiveState) => void;

interface RegisteredItem {
  value: string;
  disabled: boolean;
  state: RadioGroupItemState;
}

export class RadioGroupStore {
  private _controlled: boolean;
  private _state: RadioGroupPrimitiveState;
  private _onValueChange?: (value: string) => void;
  private readonly _items = new Map<RadioGroupItemKey, RegisteredItem>();
  private readonly _listeners = new Set<RadioGroupStoreListener>();

  constructor(options: RadioGroupStoreOptions = {}) {
    this._controlled = options.value !== undefined;
    this._state = Object.freeze({
      value:
        options.value !== undefined
          ? options.value
          : (options.defaultValue ?? null),
      disabled: options.disabled ?? false,
    });
    this._onValueChange = options.onValueChange;
  }

  get state(): RadioGroupPrimitiveState {
    return this._state;
  }

  getItemState(key: RadioGroupItemKey): RadioGroupItemState | undefined {
    return this._items.get(key)?.state;
  }

  subscribe(listener: RadioGroupStoreListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  registerItem(
    value: string,
    options: RadioGroupItemOptions = {},
  ): RadioGroupItemRegistration {
    this.assertUniqueValue(value);
    const key = Symbol(value);
    const item: RegisteredItem = {
      value,
      disabled: options.disabled ?? false,
      state: this.createItemState(value, options.disabled ?? false),
    };
    this._items.set(key, item);
    this.touch();

    return {
      key,
      setDisabled: (disabled) => {
        if (this._items.get(key) !== item || item.disabled === disabled) return;
        item.disabled = disabled;
        this.refreshItem(item);
        this.touch();
      },
      setValue: (nextValue) => {
        if (this._items.get(key) !== item || item.value === nextValue) return;
        this.assertUniqueValue(nextValue, key);
        const previousValue = item.value;
        item.value = nextValue;
        if (!this._controlled && this._state.value === previousValue) {
          this.update({ value: nextValue });
          return;
        }
        this.refreshItem(item);
        this.touch();
      },
      unregister: () => {
        if (this._items.get(key) !== item) return;
        this.unregisterItem(key, item);
      },
    };
  }

  requestSelection(key: RadioGroupItemKey): void {
    const item = this._items.get(key);
    if (
      this._state.disabled ||
      !item ||
      item.disabled ||
      this._state.value === item.value
    ) {
      return;
    }

    if (!this._controlled) this.update({ value: item.value });
    this._onValueChange?.(item.value);
  }

  setValue(value: string | null | undefined): void {
    if (value === undefined) {
      this._controlled = false;
      return;
    }
    this._controlled = true;
    this.update({ value });
  }

  setDisabled(disabled: boolean): void {
    this.update({ disabled });
  }

  setOnValueChange(callback: ((value: string) => void) | undefined): void {
    this._onValueChange = callback;
  }

  private unregisterItem(key: RadioGroupItemKey, item: RegisteredItem): void {
    this._items.delete(key);
    if (!this._controlled && this._state.value === item.value) {
      this.update({ value: null });
      return;
    }
    this.touch();
  }

  private assertUniqueValue(
    value: string,
    excludedKey?: RadioGroupItemKey,
  ): void {
    for (const [key, item] of this._items) {
      if (key !== excludedKey && item.value === value) {
        throw new Error(
          `RadioGroup item value "${value}" is already registered`,
        );
      }
    }
  }

  private createItemState(
    value: string,
    disabled: boolean,
  ): RadioGroupItemState {
    return Object.freeze({
      value,
      disabled: this._state.disabled || disabled,
      selected: value === this._state.value,
    });
  }

  private refreshItem(item: RegisteredItem): void {
    const state = this.createItemState(item.value, item.disabled);
    if (
      state.value === item.state.value &&
      state.disabled === item.state.disabled &&
      state.selected === item.state.selected
    ) {
      return;
    }
    item.state = state;
  }

  private update(next: Partial<RadioGroupPrimitiveState>): void {
    const state = { ...this._state, ...next };
    if (
      state.value === this._state.value &&
      state.disabled === this._state.disabled
    ) {
      return;
    }
    this._state = Object.freeze(state);
    for (const item of this._items.values()) this.refreshItem(item);
    this.notify();
  }

  private notify(): void {
    for (const listener of this._listeners) listener(this._state);
  }

  private touch(): void {
    this._state = Object.freeze({ ...this._state });
    this.notify();
  }
}
