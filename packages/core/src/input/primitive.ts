import {
  InputRenderableEvents,
  type InputRenderableOptions,
  type KeyEvent,
  InputRenderable as OpenTuiInputRenderable,
  type RenderContext,
} from "@opentui/core";

export interface InputPrimitiveOptions
  extends Omit<InputRenderableOptions, "onSubmit"> {
  disabled?: boolean;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

/** Thin Input primitive that preserves OpenTUI's editing and event model. */
export class InputPrimitiveRenderable extends OpenTuiInputRenderable {
  private _disabled: boolean;

  constructor(ctx: RenderContext, options: InputPrimitiveOptions = {}) {
    const {
      disabled = false,
      onInput,
      onChange,
      onSubmit,
      ...inputOptions
    } = options;
    super(ctx, inputOptions);
    this._disabled = disabled;
    this.traits = { ...this.traits, suspend: disabled };
    if (onInput) this.on(InputRenderableEvents.INPUT, onInput);
    if (onChange) this.on(InputRenderableEvents.CHANGE, onChange);
    if (onSubmit) this.on(InputRenderableEvents.ENTER, onSubmit);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    return super.handleKeyPress(key);
  }

  override focus(): void {
    if (!this._disabled) super.focus();
  }

  override submit(): boolean {
    if (this._disabled) return false;
    return super.submit();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(disabled: boolean) {
    if (disabled === this._disabled) return;
    this._disabled = disabled;
    this.traits = { ...this.traits, suspend: disabled };
    if (disabled && this._focused) this.blur();
  }
}
