import { SWITCH_SLOTS } from "./constants";
import type { SwitchSlotStyleMap, SwitchState } from "./types";

/**
 * Switch component metadata.
 * Single source of truth for slot names, style shapes, and state keys.
 *
 * Mirrors `CHECKBOX_META`'s shape — same 3-slot, 3-state-key layout — which
 * is the point of shipping Switch as a proof that Checkbox's API generalises
 * to a sibling component.
 */
export const SWITCH_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-switch",
  slots: SWITCH_SLOTS,
  slotStyleMap: {} as SwitchSlotStyleMap,
  stateKeys: ["checked", "focused", "disabled"] as const,
} as const;

export type SwitchMeta = typeof SWITCH_META;
export type SwitchStateKeys = typeof SWITCH_META.stateKeys;

type _ValidateStateKeys = SwitchStateKeys[number] extends keyof SwitchState
  ? SwitchState extends Record<SwitchStateKeys[number], boolean>
    ? true
    : never
  : never;

const _: _ValidateStateKeys = true;
