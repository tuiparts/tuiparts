import { CHECKBOX_SLOTS } from "./constants";
import type { CheckboxSlotStyleMap, CheckboxState } from "./types";

/**
 * Checkbox component metadata.
 * Single source of truth for slot names, style shapes, and state keys.
 *
 * @remarks
 * This metadata is used by the styled() API to infer:
 * - Available slot names for styling
 * - Style property shapes per slot
 * - State keys for pseudo selectors (`:checked`, `:focused`, `:disabled`)
 */
export const CHECKBOX_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-checkbox",
  /**
   * Ordered tuple of slot names.
   * Used for slot-based styling: `{ box: {...}, mark: {...}, label: {...} }`
   */
  slots: CHECKBOX_SLOTS,

  /**
   * Type carrier for slot style shapes.
   * The runtime value is empty; the type carries the style interface.
   */
  slotStyleMap: {} as CheckboxSlotStyleMap,

  /**
   * Ordered tuple of state keys.
   * Used for state selectors: `_checked`, `_focused`, `_disabled`
   */
  stateKeys: ["checked", "focused", "disabled"] as const,
} as const;

/**
 * Type alias for the checkbox metadata shape.
 * Useful for generic constraints and type extraction.
 */
export type CheckboxMeta = typeof CHECKBOX_META;

/**
 * Type alias for the checkbox state keys tuple.
 */
export type CheckboxStateKeys = typeof CHECKBOX_META.stateKeys;

/**
 * Validate that state keys match the CheckboxState interface.
 * This is a compile-time check to ensure consistency.
 */
type _ValidateStateKeys = CheckboxStateKeys[number] extends keyof CheckboxState
  ? CheckboxState extends Record<CheckboxStateKeys[number], boolean>
    ? true
    : never
  : never;

// Compile-time assertion
const _: _ValidateStateKeys = true;
