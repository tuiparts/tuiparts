import {
  type KeyEvent,
  type TextareaOptions as OpenTuiTextareaOptions,
  TextareaRenderable as OpenTuiTextareaRenderable,
  type PasteEvent,
  type RenderContext,
} from "@opentui/core";

/** Options for the OpenTUI-native Textarea Primitive. */
export interface TextareaOptions extends OpenTuiTextareaOptions {
  /** Whether focus, keyboard editing, paste, and submission are disabled. */
  disabled?: boolean;
}

/**
 * Thin multiline Textarea Primitive that preserves OpenTUI's EditBuffer and
 * event model while adding consistent disabled interaction gating.
 */
export class TextareaRenderable extends OpenTuiTextareaRenderable {
  private _disabled: boolean;

  /** Creates a Textarea around OpenTUI's native editing owner. */
  constructor(ctx: RenderContext, options: TextareaOptions = {}) {
    const { disabled = false, ...textareaOptions } = options;
    super(ctx, textareaOptions);
    this._disabled = disabled;
    this._focusable = !disabled;
    this.traits = { ...this.traits, suspend: disabled };
  }

  /** Routes a native key press unless interaction is disabled. */
  override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    return super.handleKeyPress(key);
  }

  /** Routes native paste bytes unless interaction is disabled. */
  override handlePaste(event: PasteEvent): void {
    if (!this._disabled) super.handlePaste(event);
  }

  /** Focuses the native editor unless interaction is disabled. */
  override focus(): void {
    if (!this._disabled) super.focus();
  }

  /** Invokes OpenTUI's native submit callback unless interaction is disabled. */
  override submit(): boolean {
    if (this._disabled) return false;
    return super.submit();
  }

  /** Whether user interaction with this Textarea is disabled. */
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(disabled: boolean) {
    if (disabled === this._disabled) return;
    this._disabled = disabled;
    this.traits = { ...this.traits, suspend: disabled };
    if (disabled && this._focused) this.blur();
    this._focusable = !disabled;
  }
}
