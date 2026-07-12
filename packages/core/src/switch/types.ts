import type { BoxOptions, BoxRenderable, TextOptions } from "@opentui/core";
import type {
  StyleableSubset,
  StyledOptions,
  TextStyleableSubset,
} from "../styled-renderable";
import type { SWITCH_SLOTS } from "./constants";

export type SwitchSlots = typeof SWITCH_SLOTS;

export interface SwitchState {
  checked: boolean;
  focused: boolean;
  disabled: boolean;
}

export type SwitchSlotStyleMap = {
  track: Omit<StyleableSubset<BoxOptions>, "height" | "position" | "width"> & {
    color?: TextOptions["fg"];
    /** Number of cells the track occupies. Default 4. */
    size?: number;
    /** Cells between track and label. Default 1. */
    gap?: number;
  };
  thumb: Omit<TextStyleableSubset<TextOptions>, "left" | "position">;
  label: TextStyleableSubset<TextOptions>;
};

export type SwitchSlotStyles = SwitchSlotStyleMap;

export type SwitchSlotStyleResolver = (state: SwitchState) => SwitchSlotStyles;

export interface SwitchSymbolSet {
  /** Single character drawn at the thumb position. */
  thumb: string;
  /** Single character drawn at every non-thumb track cell. */
  track: string;
}

export interface SwitchBaseOptions
  extends StyledOptions<SwitchState, SwitchSlotStyles, BoxRenderable> {
  label?: string;
  symbols?: Partial<SwitchSymbolSet>;
  styles?: SwitchSlotStyles;
  disabled?: boolean;
}

export interface ControlledSwitchOptions extends SwitchBaseOptions {
  checked: boolean;
  defaultChecked?: never;
  onCheckedChange: (checked: boolean) => void;
}

export interface UncontrolledSwitchOptions extends SwitchBaseOptions {
  checked?: never;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export type SwitchOptions = ControlledSwitchOptions | UncontrolledSwitchOptions;
