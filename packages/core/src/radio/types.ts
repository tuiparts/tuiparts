import type { BoxOptions, BoxRenderable, TextOptions } from "@opentui/core";
import type {
  StyleableSubset,
  StyledOptions,
  TextStyleableSubset,
} from "../styled-renderable";
import type { RADIO_GROUP_SLOTS, RADIO_SLOTS } from "./constants";

// =============================================================================
// Radio (leaf)
// =============================================================================

export type RadioSlots = typeof RADIO_SLOTS;

export interface RadioState {
  selected: boolean;
  focused: boolean;
  disabled: boolean;
}

export type RadioSlotStyleMap = {
  box: StyleableSubset<BoxOptions>;
  mark: TextStyleableSubset<TextOptions>;
  label: TextStyleableSubset<TextOptions>;
};

export type RadioSlotStyles = RadioSlotStyleMap;

export type RadioSlotStyleResolver = (state: RadioState) => RadioSlotStyles;

export interface RadioSymbolSet {
  selected: string;
  unselected: string;
}

export interface RadioOptions
  extends StyledOptions<RadioState, RadioSlotStyles, BoxRenderable> {
  /** Whether this radio is the currently selected option in its group. */
  selected?: boolean;
  /**
   * Fired when the radio is clicked or activated via keyboard. Parent owns state.
   *
   * Named `onActivate` rather than `onSelect` because opentui's React/Solid
   * reconcilers special-case `onSelect` for their built-in `SelectRenderable`
   * and `TabSelectRenderable` only — passing it on any other Renderable
   * silently drops the callback.
   */
  onActivate?: () => void;
  label?: string;
  symbols?: Partial<RadioSymbolSet>;
  styles?: RadioSlotStyles;
  disabled?: boolean;
}

// =============================================================================
// RadioGroup (layout-only container)
// =============================================================================

export type RadioGroupSlots = typeof RADIO_GROUP_SLOTS;

/** RadioGroup is layout-only — no interactive state. */
export type RadioGroupState = Record<string, never>;

export type RadioGroupSlotStyleMap = {
  root: StyleableSubset<BoxOptions>;
};

export type RadioGroupSlotStyles = RadioGroupSlotStyleMap;

export type RadioGroupSlotStyleResolver = (
  state: RadioGroupState,
) => RadioGroupSlotStyles;

/**
 * RadioGroup is a layout-only container. State is lifted to the parent
 * (each Radio child is independent — controlled via `selected` and
 * `onSelect`). The group provides:
 *   - shared visual context (background fill, gap, flex direction)
 *   - a single Renderable parent under which Radios live (compound DOM)
 *
 * Behavioural coordination (parent injecting `name` / `value` / `disabled`
 * into children) is intentionally out of scope for Phase 1; that requires
 * a context primitive on opentui that doesn't exist yet.
 */
export interface RadioGroupOptions
  extends StyledOptions<RadioGroupState, RadioGroupSlotStyles, BoxRenderable> {
  styles?: RadioGroupSlotStyles;
  gap?: BoxOptions["gap"];
  rowGap?: BoxOptions["rowGap"];
  columnGap?: BoxOptions["columnGap"];
}
