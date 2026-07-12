import { INPUT_SLOTS } from "./constants";
import type { InputSlotStyleMap, InputState } from "./types";

/**
 * Input component metadata.
 * Single source of truth for slot names, style shapes, and state keys.
 *
 * @remarks
 * Used by the styled() API to infer slot names, style shapes, and state
 * selectors (`_focused`, `_disabled`).
 */
export const INPUT_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-input",
  slots: INPUT_SLOTS,
  slotStyleMap: {} as InputSlotStyleMap,
  stateKeys: ["focused", "disabled"] as const,
} as const;

export type InputMeta = typeof INPUT_META;
export type InputStateKeys = typeof INPUT_META.stateKeys;

// Compile-time assertion that stateKeys match the InputState shape.
type _ValidateStateKeys = InputStateKeys[number] extends keyof InputState
  ? InputState extends Record<InputStateKeys[number], boolean>
    ? true
    : never
  : never;
const _: _ValidateStateKeys = true;
