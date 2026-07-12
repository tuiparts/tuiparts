import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import { DEFAULT_CHECKBOX_OPTIONS } from "./constants";
import type {
  CheckboxOptions,
  CheckboxSlotStyles,
  CheckboxState,
  CheckboxSymbolSet,
} from "./types";

const DEFAULT_SLOT_STYLES: CheckboxSlotStyles = {
  box: {
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 1,
  },
  mark: { color: "#A3A3A3" },
  label: { color: "#A3A3A3" },
};

const CheckboxBase = withStyles<CheckboxState, CheckboxSlotStyles>()(
  BoxRenderable,
);

export class CheckboxRenderable extends CheckboxBase {
  protected override _focusable: boolean = true;

  private _isControlled: boolean;
  private _controlledValue: boolean;
  private _internalChecked: boolean;
  private _label: string;
  private _disabled: boolean = false;
  private _symbols: CheckboxSymbolSet;
  private _markChild: TextRenderable;
  private _labelChild: TextRenderable;
  private _onCheckedChange?: (checked: boolean) => void;
  constructor(ctx: RenderContext, options: CheckboxOptions = {}) {
    super(ctx, {
      ...options,
      onMouseUp: (event) => {
        options.onMouseUp?.call(this, event);
        if (this._disabled) return;
        this.toggle();
        this.focus();
      },
    });

    this._isControlled = options.checked !== undefined;
    this._rootStyleBaseline = options;
    this._controlledValue = options.checked ?? false;
    this._internalChecked =
      options.checked ??
      options.defaultChecked ??
      DEFAULT_CHECKBOX_OPTIONS.checked;
    this._label = options.label ?? DEFAULT_CHECKBOX_OPTIONS.label;
    this._disabled = options.disabled ?? false;
    this._symbols = {
      ...DEFAULT_CHECKBOX_OPTIONS.symbols,
      ...options.symbols,
    };
    this._onCheckedChange = options.onCheckedChange;

    this._markChild = new TextRenderable(ctx, {
      content: this.currentSymbol,
      width: this.maxSymbolLength,
    });
    this._labelChild = new TextRenderable(ctx, { content: this._label });
    this.add(this._markChild);
    this.add(this._labelChild);

    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = options.styles;
    this._styleResolver = options.styleResolver;
    this.applyStylesToSlots();
  }

  private get currentSymbol(): string {
    return this.checked ? this._symbols.checked : this._symbols.unchecked;
  }

  private get maxSymbolLength(): number {
    return Math.max(
      this._symbols.checked.length,
      this._symbols.unchecked.length,
    );
  }

  public getState(): CheckboxState {
    return {
      checked: this.checked,
      focused: this._focused,
      disabled: this._disabled,
    };
  }

  private applyStylesToSlots(): void {
    const authored = this.getAuthoredStyles();
    const styles = this.mergeStyles(this._defaultStyles, authored);
    applySlotProps(
      this,
      authored.box,
      this._rootStyleBaseline,
      this._defaultStyles?.box,
    );
    applySlotProps(this._markChild, styles.mark);
    applySlotProps(this._labelChild, styles.label);
  }

  private updateCheckedVisual(): void {
    this._markChild.content = this.currentSymbol;
    this.notifyStateChanged();
  }

  public toggle(): void {
    if (this._disabled) return;
    const newValue = !this.checked;
    if (this._isControlled) {
      this._onCheckedChange?.(newValue);
      return;
    }
    this._internalChecked = newValue;
    this.updateCheckedVisual();
    this._onCheckedChange?.(newValue);
  }

  public override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.toggle();
      return true;
    }
    return false;
  }

  public override focus(): void {
    const wasFocused = this._focused;
    super.focus();
    if (!this._isDestroyed && !wasFocused && this._focused) {
      this.notifyStateChanged();
    }
  }

  public override blur(): void {
    const wasFocused = this._focused;
    super.blur();
    if (!this._isDestroyed && wasFocused && !this._focused) {
      this.notifyStateChanged();
    }
  }

  protected override onStylesChanged(): void {
    this.applyStylesToSlots();
  }

  get checked(): boolean {
    return this._isControlled ? this._controlledValue : this._internalChecked;
  }

  set checked(value: boolean) {
    if (typeof value !== "boolean") return;
    if (!this._isControlled) this._isControlled = true;
    if (this._controlledValue === value) return;
    this._controlledValue = value;
    this.updateCheckedVisual();
  }

  get defaultChecked(): boolean {
    return this._internalChecked;
  }

  set defaultChecked(value: boolean) {
    if (this._isControlled || this._internalChecked === value) return;
    this._internalChecked = value;
    this.updateCheckedVisual();
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label === value) return;
    this._label = value;
    this._labelChild.content = value;
  }

  get symbols(): CheckboxSymbolSet {
    return this._symbols;
  }

  set symbols(value: Partial<CheckboxSymbolSet>) {
    const next = { ...this._symbols, ...value };
    if (
      next.checked === this._symbols.checked &&
      next.unchecked === this._symbols.unchecked
    ) {
      return;
    }
    this._symbols = next;
    this._markChild.width = this.maxSymbolLength;
    this._markChild.content = this.currentSymbol;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (this._disabled === value) return;
    this._disabled = value;
    this.notifyStateChanged();
  }

  get onCheckedChange(): ((checked: boolean) => void) | undefined {
    return this._onCheckedChange;
  }

  set onCheckedChange(callback: ((checked: boolean) => void) | undefined) {
    this._onCheckedChange = callback;
  }

  public override destroy(): void {
    this._onCheckedChange = undefined;
    for (const child of [...this.getChildren()]) child.destroyRecursively();
    super.destroy();
  }
}
