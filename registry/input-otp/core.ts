import {
  type BoxOptions,
  BoxRenderable,
  type KeyEvent,
  type RenderContext,
  TextRenderable,
} from "@opentui/core";
import { theme } from "./theme";

export interface InputOTPOptions extends BoxOptions {
  maxLength?: number;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  mask?: string | boolean;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}

export class InputOTPRenderable extends BoxRenderable {
  private _maxLength: number;
  private _value: string;
  private _cursorIndex: number;
  private _disabled: boolean;
  private _mask?: string | boolean;
  private _onValueChange?: (value: string) => void;
  private _onComplete?: (value: string) => void;
  private readonly unsubscribeTheme: () => void;
  private slotBoxes: BoxRenderable[] = [];
  private slotTexts: TextRenderable[] = [];

  constructor(ctx: RenderContext, options: InputOTPOptions = {}) {
    const {
      maxLength = 6,
      value,
      defaultValue = "",
      disabled = false,
      mask,
      onValueChange,
      onComplete,
      ...boxOptions
    } = options;
    super(ctx, {
      ...boxOptions,
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
      focusable: !disabled,
    });
    this._maxLength = maxLength;
    this._value = value !== undefined ? value : defaultValue;
    this._cursorIndex = Math.min(this._value.length, maxLength - 1);
    this._disabled = disabled;
    this._mask = mask;
    this._onValueChange = onValueChange;
    this._onComplete = onComplete;

    this.buildSlots();
    this.syncSlots();

    this.unsubscribeTheme = theme.subscribe(() => {
      this.syncSlots();
    });
  }

  private buildSlots(): void {
    const tokens = theme.get();
    for (let i = 0; i < this._maxLength; i++) {
      const slotBox = new BoxRenderable(this._ctx, {
        width: 3,
        height: 3,
        border: true,
        borderStyle: "single",
        borderColor: tokens.colors.border,
        alignItems: "center",
        justifyContent: "center",
      });
      const slotText = new TextRenderable(this._ctx, {
        content: " ",
        fg: tokens.colors.foreground,
      });
      slotBox.add(slotText);
      this.add(slotBox);
      this.slotBoxes.push(slotBox);
      this.slotTexts.push(slotText);
    }
  }

  syncSlots(): void {
    const tokens = theme.get();
    for (let i = 0; i < this._maxLength; i++) {
      const char = this._value[i];
      const isActive = this._focused && i === this._cursorIndex;
      const box = this.slotBoxes[i];
      const text = this.slotTexts[i];

      if (box) {
        box.borderColor = isActive
          ? tokens.colors.primary
          : tokens.colors.border;
      }
      if (text) {
        if (char !== undefined) {
          text.content = this._mask
            ? typeof this._mask === "string"
              ? this._mask
              : "•"
            : char;
          text.fg = tokens.colors.foreground;
        } else if (isActive) {
          text.content = "█";
          text.fg = tokens.colors.primary;
        } else {
          text.content = " ";
          text.fg = tokens.colors.foreground;
        }
      }
    }
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;

    if (key.name === "backspace") {
      if (this._value.length > 0) {
        this._value = this._value.slice(0, -1);
        this._cursorIndex = Math.max(0, this._value.length);
        this.syncSlots();
        this._onValueChange?.(this._value);
        return true;
      }
      return true;
    }

    if (key.name === "left") {
      if (this._cursorIndex > 0) {
        this._cursorIndex--;
        this.syncSlots();
        return true;
      }
      return false;
    }

    if (key.name === "right") {
      if (
        this._cursorIndex < Math.min(this._value.length, this._maxLength - 1)
      ) {
        this._cursorIndex++;
        this.syncSlots();
        return true;
      }
      return false;
    }

    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      if (this._value.length < this._maxLength) {
        this._value += key.sequence;
        this._cursorIndex = Math.min(this._value.length, this._maxLength - 1);
        this.syncSlots();
        this._onValueChange?.(this._value);
        if (this._value.length === this._maxLength) {
          this._onComplete?.(this._value);
        }
        return true;
      }
    }

    return super.handleKeyPress?.(key) ?? false;
  }

  override focus(): void {
    if (!this._disabled) {
      super.focus();
      this.syncSlots();
    }
  }

  override blur(): void {
    super.blur();
    this.syncSlots();
  }

  override destroy(): void {
    this.unsubscribeTheme();
    super.destroy();
  }

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val.slice(0, this._maxLength);
    this._cursorIndex = Math.min(this._value.length, this._maxLength - 1);
    this.syncSlots();
  }

  get maxLength(): number {
    return this._maxLength;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(disabled: boolean) {
    this._disabled = disabled;
    this._focusable = !disabled;
    if (disabled && this._focused) this.blur();
    this.syncSlots();
  }
}

export function createInputOTP(
  ctx: RenderContext,
  options: InputOTPOptions = {},
): InputOTPRenderable {
  return new InputOTPRenderable(ctx, options);
}
