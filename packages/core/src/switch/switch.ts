import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import {
  DEFAULT_SWITCH_OPTIONS,
  DEFAULT_TRACK_GAP,
  DEFAULT_TRACK_SIZE,
} from "./constants";
import type {
  SwitchOptions,
  SwitchSlotStyles,
  SwitchState,
  SwitchSymbolSet,
} from "./types";

const DEFAULT_SLOT_STYLES: SwitchSlotStyles = {
  track: {
    backgroundColor: "transparent",
    color: "#525252",
    size: DEFAULT_TRACK_SIZE,
    gap: DEFAULT_TRACK_GAP,
  },
  thumb: { color: "#A3A3A3" },
  label: { color: "#A3A3A3" },
};

const SwitchBase = withStyles<SwitchState, SwitchSlotStyles>()(BoxRenderable);

export class SwitchRenderable extends SwitchBase {
  protected override _focusable: boolean = true;

  private _isControlled: boolean;
  private _controlledValue: boolean;
  private _internalChecked: boolean;
  private _label: string;
  private _disabled: boolean = false;
  private _symbols: SwitchSymbolSet;
  private _track: BoxRenderable;
  private _trackText: TextRenderable;
  private _thumb: TextRenderable;
  private _labelChild?: TextRenderable;
  private _trackSize: number = DEFAULT_TRACK_SIZE;
  private _onCheckedChange?: (checked: boolean) => void;

  constructor(ctx: RenderContext, options: SwitchOptions = {}) {
    super(ctx, {
      ...options,
      flexDirection: "row",
      onMouseUp: (event) => {
        options.onMouseUp?.call(this, event);
        if (this._disabled) return;
        this.toggle();
        this.focus();
      },
    });

    this._isControlled = options.checked !== undefined;
    this._controlledValue = options.checked ?? false;
    this._internalChecked =
      options.checked ??
      options.defaultChecked ??
      DEFAULT_SWITCH_OPTIONS.checked;
    this._label = options.label ?? DEFAULT_SWITCH_OPTIONS.label;
    this._disabled = options.disabled ?? false;
    this._symbols = { ...DEFAULT_SWITCH_OPTIONS.symbols, ...options.symbols };
    this._onCheckedChange = options.onCheckedChange;

    this._track = new BoxRenderable(ctx, {
      height: 1,
      position: "relative",
      width: DEFAULT_TRACK_SIZE,
    });
    this._trackText = new TextRenderable(ctx, {
      content: this._symbols.track.repeat(DEFAULT_TRACK_SIZE),
    });
    this._thumb = new TextRenderable(ctx, {
      content: this._symbols.thumb,
      position: "absolute",
      left: 0,
    });
    this._track.add(this._trackText);
    this._track.add(this._thumb);
    this.add(this._track);
    if (this._label.length > 0) this.createLabelChild();

    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = options.styles;
    this._styleResolver = options.styleResolver;
    this.applyStylesToSlots();
  }

  public getState(): SwitchState {
    return {
      checked: this.checked,
      focused: this._focused,
      disabled: this._disabled,
    };
  }

  private applyStylesToSlots(): void {
    const styles = this.getResolvedStyles();
    const {
      color,
      size = DEFAULT_TRACK_SIZE,
      gap = DEFAULT_TRACK_GAP,
      ...track
    } = styles.track ?? {};
    applySlotProps(this._track, track);
    if (this._trackSize !== size || this._track.width !== size) {
      this._trackSize = size;
      this._track.width = size;
      this._trackText.content = this._symbols.track.repeat(size);
    }
    this.gap = gap;
    applySlotProps(this._trackText, { color });
    applySlotProps(this._thumb, styles.thumb);
    if (this._labelChild) {
      applySlotProps(this._labelChild, styles.label);
    }
    this.updateThumbPosition();
  }

  private createLabelChild(): void {
    this._labelChild = new TextRenderable(this._ctx, { content: this._label });
    this.add(this._labelChild);
    applySlotProps(this._labelChild, this.getResolvedStyles().label);
  }

  private updateThumbPosition(): void {
    const left = this.checked ? Math.max(0, this._trackSize - 1) : 0;
    if (this._thumb.left !== left) this._thumb.left = left;
  }

  public toggle(): void {
    if (this._disabled) return;
    const newValue = !this.checked;
    if (this._isControlled) {
      this._onCheckedChange?.(newValue);
      return;
    }
    this._internalChecked = newValue;
    this.notifyStateChanged();
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
    this.notifyStateChanged();
  }

  get defaultChecked(): boolean {
    return this._internalChecked;
  }

  set defaultChecked(value: boolean) {
    if (this._isControlled || this._internalChecked === value) return;
    this._internalChecked = value;
    this.notifyStateChanged();
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label === value) return;
    const hadLabel = this._label.length > 0;
    this._label = value;
    if (!hadLabel && value.length > 0) {
      this.createLabelChild();
    } else if (hadLabel && value.length === 0 && this._labelChild) {
      const child = this._labelChild;
      this._labelChild = undefined;
      this.remove(child);
      child.destroy();
    } else if (this._labelChild) {
      this._labelChild.content = value;
    }
  }

  get symbols(): SwitchSymbolSet {
    return this._symbols;
  }

  set symbols(value: Partial<SwitchSymbolSet>) {
    const next = { ...this._symbols, ...value };
    if (
      next.thumb === this._symbols.thumb &&
      next.track === this._symbols.track
    ) {
      return;
    }
    this._symbols = next;
    this._trackText.content = next.track.repeat(this._trackSize);
    this._thumb.content = next.thumb;
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
