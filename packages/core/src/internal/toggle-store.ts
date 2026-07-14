export interface ToggleState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly focused: boolean;
}

export interface ToggleStoreOptions {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
}

type ToggleStateListener = (state: ToggleState) => void;

export class ToggleStoreState {
  private controlled: boolean;
  private snapshot: ToggleState;
  private onCheckedChange?: (checked: boolean) => void;
  private readonly listeners = new Set<ToggleStateListener>();

  constructor(options: ToggleStoreOptions = {}) {
    this.controlled = options.checked !== undefined;
    this.snapshot = Object.freeze({
      checked: options.checked ?? options.defaultChecked ?? false,
      disabled: options.disabled ?? false,
      focused: false,
    });
    this.onCheckedChange = options.onCheckedChange;
  }

  get state(): ToggleState {
    return this.snapshot;
  }

  subscribe(listener: ToggleStateListener): () => void {
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

  private update(next: Partial<ToggleState>): void {
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
