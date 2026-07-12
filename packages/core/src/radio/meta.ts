import { RADIO_GROUP_SLOTS, RADIO_SLOTS } from "./constants";
import type {
  RadioGroupSlotStyleMap,
  RadioGroupState,
  RadioSlotStyleMap,
  RadioState,
} from "./types";

// =============================================================================
// Radio (leaf)
// =============================================================================

export const RADIO_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-radio",
  slots: RADIO_SLOTS,
  slotStyleMap: {} as RadioSlotStyleMap,
  stateKeys: ["selected", "focused", "disabled"] as const,
} as const;

export type RadioMeta = typeof RADIO_META;
export type RadioStateKeys = typeof RADIO_META.stateKeys;

type _ValidateRadioStateKeys = RadioStateKeys[number] extends keyof RadioState
  ? RadioState extends Record<RadioStateKeys[number], boolean>
    ? true
    : never
  : never;
const _radioCheck: _ValidateRadioStateKeys = true;

// =============================================================================
// RadioGroup (compound parent)
// =============================================================================

export const RADIO_GROUP_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-radio-group",
  slots: RADIO_GROUP_SLOTS,
  slotStyleMap: {} as RadioGroupSlotStyleMap,
  stateKeys: [] as const,
} as const;

export type RadioGroupMeta = typeof RADIO_GROUP_META;
export type RadioGroupStateKeys = typeof RADIO_GROUP_META.stateKeys;

// RadioGroupState is intentionally empty (no interactive state on the group).
type _ValidateGroupState = RadioGroupState extends object ? true : never;
const _groupCheck: _ValidateGroupState = true;
