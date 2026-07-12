import type { Color, InputRenderableOptions } from "@opentui/core";
import type { StyleResolver } from "../styled-renderable";
import type { INPUT_SLOTS } from "./constants";

export type InputSlots = typeof INPUT_SLOTS;

export interface InputState {
  focused: boolean;
  disabled: boolean;
}

export type InputSlotStyleMap = {
  root: {
    color?: Color;
    backgroundColor?: Color;
    placeholderColor?: Color;
    cursorColor?: Color;
    selectionColor?: Color;
    selectionBackgroundColor?: Color;
  };
};

export type InputSlotStyles = InputSlotStyleMap;

export type InputSlotStyleResolver = (state: InputState) => InputSlotStyles;

/**
 * Options for the wrapped Input.
 *
 * Extends opentui's `InputRenderableOptions` and layers on the styled-config
 * surface (`styles` / `styleResolver`) plus controlled/uncontrolled value
 * conventions matching how `Checkbox` distinguishes `checked` /
 * `defaultChecked`.
 *
 * Note: opentui's `InputRenderableOptions.value` is treated as the initial
 * value. We override that semantics: pass `value` *and* `onChange` for
 * controlled mode, or `defaultValue` for uncontrolled.
 */
export interface InputOptions
  extends Omit<InputRenderableOptions, "value" | "onSubmit"> {
  /** Controlled value. When set, parent owns state via `onChange`. */
  value?: string;
  /** Uncontrolled initial value. Ignored if `value` is set. */
  defaultValue?: string;
  /** Fires on every text mutation. Required for controlled mode. */
  onChange?: (value: string) => void;
  /** Fires on Enter (and on blur if value changed since focus). */
  onSubmit?: (value: string) => void;
  /** Disables editing and focus. */
  disabled?: boolean;
  /** Styled-config surface — same shape as other StyledRenderable components. */
  styles?: InputSlotStyles;
  styleResolver?: StyleResolver<InputState, InputSlotStyles>;
}
