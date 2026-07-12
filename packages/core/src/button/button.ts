import {
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import { DEFAULT_BUTTON_OPTIONS } from "./constants";
import type { ButtonOptions, ButtonSlotStyles, ButtonState } from "./types";

const DEFAULT_SLOT_STYLES: ButtonSlotStyles = {
  root: {
    backgroundColor: "#262626",
    paddingX: 2,
    paddingY: 0,
  },
  label: { color: "#E5E5E5" },
};

const ButtonBase = withStyles<ButtonState, ButtonSlotStyles>()(BoxRenderable);

export class ButtonRenderable extends ButtonBase {
  protected override _focusable: boolean = true;

  private _label: string;
  private _labelChild: TextRenderable;
  private _disabled: boolean = false;
  private _isPressed: boolean = false;
  private _onPress?: () => void;
  constructor(ctx: RenderContext, options: ButtonOptions = {}) {
    super(ctx, {
      ...options,
      onMouseDown: (event) => {
        options.onMouseDown?.call(this, event);
        if (this._disabled) return;
        this._isPressed = true;
        this.notifyStateChanged();
      },
      onMouseUp: (event) => {
        options.onMouseUp?.call(this, event);
        if (this._disabled) return;
        const wasPressed = this._isPressed;
        this._isPressed = false;
        this.focus();
        this.notifyStateChanged();
        if (wasPressed) this._onPress?.();
      },
    });

    this._label = options.label ?? DEFAULT_BUTTON_OPTIONS.label;
    this._rootStyleBaseline = options;
    this._disabled = options.disabled ?? false;
    this._onPress = options.onPress;
    this._labelChild = new TextRenderable(ctx, { content: this._label });
    this.add(this._labelChild);

    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = options.styles;
    this._styleResolver = options.styleResolver;
    this.applyStylesToSlots();
  }

  public getState(): ButtonState {
    return {
      focused: this._focused,
      disabled: this._disabled,
      pressed: this._isPressed,
    };
  }

  private applyStylesToSlots(): void {
    const authored = this.getAuthoredStyles();
    const styles = this.mergeStyles(this._defaultStyles, authored);
    applySlotProps(
      this,
      authored.root,
      this._rootStyleBaseline,
      this._defaultStyles?.root,
    );
    applySlotProps(this._labelChild, styles.label);
  }

  public press(): void {
    if (this._disabled) return;
    this._onPress?.();
  }

  public override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    if (key.name === "space" || key.name === "return" || key.name === "enter") {
      this.press();
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

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label === value) return;
    this._label = value;
    this._labelChild.content = value;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (this._disabled === value) return;
    this._disabled = value;
    if (value) this._isPressed = false;
    this.notifyStateChanged();
  }

  get onPress(): (() => void) | undefined {
    return this._onPress;
  }

  set onPress(callback: (() => void) | undefined) {
    this._onPress = callback;
  }

  public override destroy(): void {
    this._onPress = undefined;
    for (const child of [...this.getChildren()]) child.destroyRecursively();
    super.destroy();
  }
}
