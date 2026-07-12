import { BUTTON_SLOTS } from "./constants";
import type { ButtonSlotStyleMap, ButtonState } from "./types";

/**
 * Button component metadata.
 * Single source of truth for slot names, style shapes, and state keys.
 *
 * @remarks
 * Used by the styled() API to infer slot names, style shapes, and state
 * selectors (`_focused`, `_disabled`, `_pressed`).
 */
export const BUTTON_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-button",
  slots: BUTTON_SLOTS,
  slotStyleMap: {} as ButtonSlotStyleMap,
  stateKeys: ["focused", "disabled", "pressed"] as const,
} as const;

export type ButtonMeta = typeof BUTTON_META;
export type ButtonStateKeys = typeof BUTTON_META.stateKeys;

// Compile-time assertion that stateKeys match the ButtonState shape.
type _ValidateStateKeys = ButtonStateKeys[number] extends keyof ButtonState
  ? ButtonState extends Record<ButtonStateKeys[number], boolean>
    ? true
    : never
  : never;
const _: _ValidateStateKeys = true;
