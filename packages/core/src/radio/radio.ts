import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import { DEFAULT_RADIO_OPTIONS } from "./constants";
import type {
  RadioOptions,
  RadioSlotStyles,
  RadioState,
  RadioSymbolSet,
} from "./types";

const DEFAULT_SLOT_STYLES: RadioSlotStyles = {
  box: {
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 1,
  },
  mark: { color: "#A3A3A3" },
  label: { color: "#A3A3A3" },
};

const RadioBase = withStyles<RadioState, RadioSlotStyles>()(BoxRenderable);

export class RadioRenderable extends RadioBase {
  protected override _focusable: boolean = true;

  private _label: string;
  private _disabled: boolean = false;
  private _selected: boolean = false;
  private _symbols: RadioSymbolSet;
  private _markChild: TextRenderable;
  private _labelChild: TextRenderable;
  private _onActivate?: () => void;
  constructor(ctx: RenderContext, options: RadioOptions = {}) {
    super(ctx, {
      ...options,
      onMouseUp: (event) => {
        options.onMouseUp?.call(this, event);
        if (this._disabled) return;
        this.focus();
        this._onActivate?.();
      },
    });

    this._label = options.label ?? DEFAULT_RADIO_OPTIONS.label;
    this._rootStyleBaseline = options;
    this._symbols = {
      ...DEFAULT_RADIO_OPTIONS.symbols,
      ...options.symbols,
    };
    this._selected = options.selected ?? false;
    this._disabled = options.disabled ?? false;
    this._onActivate = options.onActivate;

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
    return this._selected ? this._symbols.selected : this._symbols.unselected;
  }

  private get maxSymbolLength(): number {
    return Math.max(
      this._symbols.selected.length,
      this._symbols.unselected.length,
    );
  }

  public getState(): RadioState {
    return {
      selected: this._selected,
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

  public activate(): void {
    if (this._disabled) return;
    this._onActivate?.();
  }

  public override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.activate();
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

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    if (typeof value !== "boolean" || this._selected === value) return;
    this._selected = value;
    this._markChild.content = this.currentSymbol;
    this.notifyStateChanged();
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label === value) return;
    this._label = value;
    this._labelChild.content = value;
  }

  get symbols(): RadioSymbolSet {
    return this._symbols;
  }

  set symbols(value: Partial<RadioSymbolSet>) {
    const next = { ...this._symbols, ...value };
    if (
      next.selected === this._symbols.selected &&
      next.unselected === this._symbols.unselected
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

  get onActivate(): (() => void) | undefined {
    return this._onActivate;
  }

  set onActivate(callback: (() => void) | undefined) {
    this._onActivate = callback;
  }

  public override destroy(): void {
    this._onActivate = undefined;
    for (const child of [...this.getChildren()]) child.destroyRecursively();
    super.destroy();
  }
}
