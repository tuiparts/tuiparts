import type { BoxOptions, BoxRenderable, TextOptions } from "@opentui/core";
import type {
  StyleableSubset,
  StyledOptions,
  TextStyleableSubset,
} from "../styled-renderable";
import type { BUTTON_SLOTS } from "./constants";

export type ButtonSlots = typeof BUTTON_SLOTS;

export interface ButtonState {
  focused: boolean;
  disabled: boolean;
  pressed: boolean;
}

export type ButtonSlotStyleMap = {
  root: StyleableSubset<BoxOptions>;
  label: TextStyleableSubset<TextOptions>;
};

export type ButtonSlotStyles = ButtonSlotStyleMap;

export type ButtonSlotStyleResolver = (state: ButtonState) => ButtonSlotStyles;

export interface ButtonOptions
  extends StyledOptions<ButtonState, ButtonSlotStyles, BoxRenderable> {
  label?: string;
  styles?: ButtonSlotStyles;
  disabled?: boolean;
  onPress?: () => void;
}
