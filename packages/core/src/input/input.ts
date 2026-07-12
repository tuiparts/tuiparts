import {
  InputRenderableEvents,
  type KeyEvent,
  InputRenderable as OtuiInputRenderable,
  type RenderContext,
} from "@opentui/core";
import { applySlotProps, withStyles } from "../styled-renderable";
import { DEFAULT_INPUT_OPTIONS } from "./constants";
import type { InputOptions, InputSlotStyles, InputState } from "./types";

const DEFAULT_SLOT_STYLES: InputSlotStyles = {
  root: {
    backgroundColor: "transparent",
    color: "#E5E5E5",
    placeholderColor: "#737373",
    cursorColor: "#E5E5E5",
  },
};

const EMPTY_STATE: InputState = Object.freeze({
  focused: false,
  disabled: false,
});

/**
 * Wrapped opentui `InputRenderable` with the `@opentui-ui` styled-config
 * surface. Editing, IME, paste, undo/redo, selection, and event emission are
 * inherited unchanged from upstream.
 *
 * **Pattern:** wrap-and-restyle. The `withStyles<...>()(OtuiInputRenderable)`
 * mixin layers the styled-config protocol (`_styles` / `_styleResolver` /
 * `getResolvedStyles` / `onStylesChanged` / typed `styles` setters) onto the
 * upstream Renderable. The only Input-specific code below is controlled-value
 * glue and applying resolved styles when configuration or state changes.
 */
const InputBase = withStyles<InputState, InputSlotStyles>()(
  OtuiInputRenderable,
);

export class InputRenderable extends InputBase {
  private _disabled: boolean = false;
  private _isControlled: boolean;
  private _onChange?: (value: string) => void;
  private _onSubmit?: (value: string) => void;
  constructor(ctx: RenderContext, options: InputOptions = {}) {
    const {
      styles,
      styleResolver,
      value,
      defaultValue,
      onChange,
      onSubmit,
      disabled,
      ...otuiOptions
    } = options;

    const initialValue =
      value ?? defaultValue ?? DEFAULT_INPUT_OPTIONS.defaultValue;

    super(ctx, {
      ...otuiOptions,
      placeholder: otuiOptions.placeholder ?? DEFAULT_INPUT_OPTIONS.placeholder,
      value: initialValue,
    });

    this._rootStyleBaseline = otuiOptions;
    this._isControlled = value !== undefined;
    this._defaultStyles = DEFAULT_SLOT_STYLES;
    this._styles = styles;
    this._styleResolver = styleResolver;
    this._disabled = disabled ?? false;
    this._onChange = onChange;
    this._onSubmit = onSubmit;
    this.applyStylesToRoot();

    if (this._disabled) {
      this.traits = { ...this.traits, suspend: true };
    }

    this.on(InputRenderableEvents.INPUT, this.handleInput);
    this.on(InputRenderableEvents.ENTER, this.handleSubmit);
  }

  public override getState(): InputState {
    if (!this._focused && !this._disabled) return EMPTY_STATE;
    return {
      focused: this._focused,
      disabled: this._disabled,
    };
  }

  private applyStylesToRoot(): void {
    const authoredRoot = this.getAuthoredStyles().root;
    const defaultRoot = this._defaultStyles?.root;
    applySlotProps(
      this,
      {
        ...authoredRoot,
        focusedBackgroundColor: authoredRoot?.backgroundColor,
        focusedTextColor: authoredRoot?.color,
      },
      this._rootStyleBaseline,
      {
        ...defaultRoot,
        focusedBackgroundColor: defaultRoot?.backgroundColor,
        focusedTextColor: defaultRoot?.color,
      },
    );
  }

  protected override onStylesChanged(): void {
    this.applyStylesToRoot();
  }

  /**
   * Gate keyboard input on `disabled`. Upstream's handleKeyPress drives all
   * editing operations, so blocking it cleanly suspends the input.
   */
  public override handleKeyPress(key: KeyEvent): boolean {
    if (this._disabled) return false;
    return super.handleKeyPress(key);
  }

  public override focus(): void {
    if (this._disabled) return;
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

  private handleInput = (next: string): void => {
    // In controlled mode the parent owns the value; we do NOT mutate it
    // beyond what opentui's superclass already did (the controlled parent
    // will reconcile by setting `value` back via the prop).
    this._onChange?.(next);
  };

  private handleSubmit = (next: string): void => {
    this._onSubmit?.(next);
  };

  // ---- Disabled ----------------------------------------------------------

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (this._disabled === value) return;
    this._disabled = value;
    this.traits = { ...this.traits, suspend: value };
    if (value && this._focused) {
      this.blur();
    } else {
      this.notifyStateChanged();
    }
  }

  // ---- Controlled-vs-uncontrolled --------------------------------------
  //
  // Opentui's superclass owns a `value` setter. Our override layers in the
  // controlled-mode flag so a parent passing `value` after construction
  // switches us to controlled mode (matching how Checkbox handles `checked`).

  override set value(next: string) {
    if (!this._isControlled) {
      this._isControlled = true;
    }
    super.value = next;
  }

  override get value(): string {
    return super.value;
  }

  get onChange(): ((value: string) => void) | undefined {
    return this._onChange;
  }

  set onChange(callback: ((value: string) => void) | undefined) {
    this._onChange = callback;
  }

  get onSubmitCallback(): ((value: string) => void) | undefined {
    return this._onSubmit;
  }

  set onSubmitCallback(callback: ((value: string) => void) | undefined) {
    this._onSubmit = callback;
  }
}
