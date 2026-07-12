import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
} from "@opentui/core";

export type RadioGroupItemKey = symbol;

export interface RadioGroupChangeDetails {
  readonly reason: "activation" | "navigation";
  readonly source: "keyboard" | "pointer" | "programmatic";
}

export interface RadioGroupPrimitiveState {
  readonly value: string | null;
  readonly disabled: boolean;
}

export interface RadioGroupItemState {
  readonly value: string;
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly selected: boolean;
}

export type RadioGroupValueChangeHandler = (
  value: string,
  details: RadioGroupChangeDetails,
) => void;

export interface RadioGroupStoreOptions {
  value?: string | null;
  defaultValue?: string | null;
  disabled?: boolean;
  onValueChange?: RadioGroupValueChangeHandler;
}

export interface RadioGroupItemRegistrationOptions {
  disabled?: boolean;
  focus?: () => void;
  isAvailable?: () => boolean;
}

export interface RadioGroupItemRegistration {
  readonly key: RadioGroupItemKey;
  setDisabled(disabled: boolean): void;
  setFocused(focused: boolean): void;
  setValue(value: string): void;
  unregister(): void;
}

type RadioGroupStoreListener = (state: RadioGroupPrimitiveState) => void;

interface RegisteredItem {
  value: string;
  disabled: boolean;
  focused: boolean;
  focus?: () => void;
  isAvailable?: () => boolean;
  state: RadioGroupItemState;
}

const PROGRAMMATIC_ACTIVATION_DETAILS: RadioGroupChangeDetails = Object.freeze({
  reason: "activation",
  source: "programmatic",
});

export class RadioGroupStore {
  private _controlled: boolean;
  private _state: RadioGroupPrimitiveState;
  private _onValueChange?: RadioGroupValueChangeHandler;
  private readonly _items = new Map<RadioGroupItemKey, RegisteredItem>();
  private readonly _listeners = new Set<RadioGroupStoreListener>();
  private readonly _mutationQueue: Array<() => void> = [];
  private _mutating = false;
  private _notificationDepth = 0;

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
    options: RadioGroupItemRegistrationOptions = {},
  ): RadioGroupItemRegistration {
    this.assertUniqueValue(value);
    const key = Symbol(value);
    const item: RegisteredItem = {
      value,
      disabled: options.disabled ?? false,
      focused: false,
      focus: options.focus,
      isAvailable: options.isAvailable,
      state: this.createItemState(value, options.disabled ?? false, false),
    };
    this._items.set(key, item);
    this.touch();

    return {
      key,
      setDisabled: (disabled) => {
        this.runMutation(() => {
          if (this._items.get(key) !== item || item.disabled === disabled)
            return;
          item.disabled = disabled;
          if (disabled) item.focused = false;
          this.refreshItem(item);
          this.touch();
        });
      },
      setFocused: (focused) => {
        this.runMutation(() => {
          if (this._items.get(key) !== item || item.focused === focused) return;
          if (focused && (this._state.disabled || item.disabled)) return;
          if (focused) {
            for (const other of this._items.values()) {
              if (other !== item && other.focused) {
                other.focused = false;
                this.refreshItem(other);
              }
            }
          }
          item.focused = focused;
          this.refreshItem(item);
          this.touch();
        });
      },
      setValue: (nextValue) => {
        this.runMutation(() => {
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
        });
      },
      unregister: () => {
        this.runMutation(() => {
          if (this._items.get(key) !== item) return;
          this.unregisterItem(key, item);
        });
      },
    };
  }

  requestSelection(
    key: RadioGroupItemKey,
    details: RadioGroupChangeDetails = PROGRAMMATIC_ACTIVATION_DETAILS,
  ): void {
    this.runMutation(() => {
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
      this._onValueChange?.(item.value, Object.freeze({ ...details }));
    });
  }

  setValue(value: string | null | undefined): void {
    this.runMutation(() => {
      if (value === undefined) {
        this._controlled = false;
        return;
      }
      this._controlled = true;
      this.update({ value });
    });
  }

  setDisabled(disabled: boolean): void {
    this.runMutation(() => {
      if (disabled) {
        for (const item of this._items.values()) item.focused = false;
      }
      this.update({ disabled });
    });
  }

  setOnValueChange(callback: RadioGroupValueChangeHandler | undefined): void {
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
    focused: boolean,
  ): RadioGroupItemState {
    return Object.freeze({
      value,
      disabled: this._state.disabled || disabled,
      focused,
      selected: value === this._state.value,
    });
  }

  private refreshItem(item: RegisteredItem): void {
    const state = this.createItemState(item.value, item.disabled, item.focused);
    if (
      state.value === item.state.value &&
      state.disabled === item.state.disabled &&
      state.focused === item.state.focused &&
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
    const state = this._state;
    this._notificationDepth += 1;
    try {
      for (const listener of [...this._listeners]) listener(state);
    } finally {
      this._notificationDepth -= 1;
    }
  }

  private touch(): void {
    this._state = Object.freeze({ ...this._state });
    this.notify();
  }

  private runMutation(mutation: () => void): void {
    if (this._mutating || this._notificationDepth > 0) {
      this._mutationQueue.push(mutation);
      return;
    }

    this._mutating = true;
    try {
      mutation();
      while (this._mutationQueue.length > 0) this._mutationQueue.shift()?.();
    } finally {
      this._mutating = false;
    }
  }
}

export interface RadioGroupRootOptions
  extends BoxOptions,
    RadioGroupStoreOptions {
  store?: RadioGroupStore;
}

export class RadioGroupRootRenderable extends BoxRenderable {
  protected override _focusable = false;

  private readonly _store: RadioGroupStore;
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupRootOptions = {}) {
    const {
      store,
      value,
      defaultValue,
      disabled,
      onValueChange,
      ...boxOptions
    } = options;
    super(ctx, boxOptions);
    this._store =
      store ??
      new RadioGroupStore({ value, defaultValue, disabled, onValueChange });
    this._unsubscribe = this._store.subscribe(() => this.requestRender());
  }

  get store(): RadioGroupStore {
    return this._store;
  }

  getState(): RadioGroupPrimitiveState {
    return this._store.state;
  }

  get value(): string | null {
    return this._store.state.value;
  }

  set value(value: string | null | undefined) {
    this._store.setValue(value);
  }

  get disabled(): boolean {
    return this._store.state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._store.setDisabled(disabled ?? false);
  }

  set onValueChange(callback: RadioGroupValueChangeHandler | undefined) {
    this._store.setOnValueChange(callback);
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}

export interface RadioGroupItemOptions extends BoxOptions {
  store: RadioGroupStore;
  value: string;
  disabled?: boolean;
}

type RadioGroupItemListener = (state: RadioGroupItemState) => void;

export class RadioGroupItemRenderable extends BoxRenderable {
  protected override _focusable = true;

  private readonly _store: RadioGroupStore;
  private readonly _registration: RadioGroupItemRegistration;
  private _state: RadioGroupItemState;
  private readonly _listeners = new Set<RadioGroupItemListener>();
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupItemOptions) {
    const { store, value, disabled, ...boxOptions } = options;
    super(ctx, {
      ...boxOptions,
      onMouseUp: (event) => {
        boxOptions.onMouseUp?.call(this, event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          this._state.disabled
        )
          return;
        this.focus();
        this.press("pointer");
      },
    });
    this._store = store;
    this._registration = store.registerItem(value, {
      disabled,
      focus: () => this.focus(),
      isAvailable: () =>
        !this._isDestroyed && this.visible && this.parent !== null,
    });
    const state = store.getItemState(this._registration.key);
    if (!state) throw new Error("RadioGroup Item registration failed");
    this._state = state;
    this._unsubscribe = store.subscribe(() => {
      const state = store.getItemState(this._registration.key);
      if (!state || state === this._state) return;
      if (state.disabled && this._focused) {
        this._state = state;
        super.blur();
        this._registration.setFocused(false);
        this.requestRender();
        for (const listener of this._listeners) listener(state);
        return;
      }
      this._state = state;
      this.requestRender();
      for (const listener of this._listeners) listener(state);
    });
  }

  get key(): RadioGroupItemKey {
    return this._registration.key;
  }

  getState(): RadioGroupItemState {
    return this._state;
  }

  subscribe(listener: RadioGroupItemListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  press(source: RadioGroupChangeDetails["source"] = "programmatic"): void {
    this._store.requestSelection(this.key, { reason: "activation", source });
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._state.disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.press("keyboard");
      return true;
    }
    return false;
  }

  override focus(): void {
    if (this._state.disabled) return;
    super.focus();
    this._registration.setFocused(this._focused);
  }

  override blur(): void {
    super.blur();
    this._registration.setFocused(false);
  }

  get selected(): boolean {
    return this._state.selected;
  }

  get value(): string {
    return this._state.value;
  }

  set value(value: string) {
    this._registration.setValue(value);
  }

  get disabled(): boolean {
    return this._state.disabled;
  }

  set disabled(disabled: boolean | null | undefined) {
    this._registration.setDisabled(disabled ?? false);
  }

  override destroy(): void {
    this._unsubscribe();
    this._state = Object.freeze({
      ...this._state,
      disabled: true,
      focused: false,
      selected: false,
    });
    for (const listener of this._listeners) listener(this._state);
    this._listeners.clear();
    this._registration.unregister();
    super.destroy();
  }
}

export interface RadioGroupIndicatorOptions extends BoxOptions {
  item: RadioGroupItemRenderable;
}

export class RadioGroupIndicatorRenderable extends BoxRenderable {
  private readonly _item: RadioGroupItemRenderable;
  private readonly _unsubscribe: () => void;

  constructor(ctx: RenderContext, options: RadioGroupIndicatorOptions) {
    const { item, ...boxOptions } = options;
    super(ctx, { ...boxOptions, visible: item.selected });
    this._item = item;
    this._unsubscribe = item.subscribe((state) => {
      this.visible = state.selected;
    });
  }

  getState(): RadioGroupItemState {
    return this._item.getState();
  }

  override destroy(): void {
    this._unsubscribe();
    super.destroy();
  }
}
