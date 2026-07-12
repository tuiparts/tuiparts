import { BADGE_SLOTS } from "./constants";
import type { BadgeSlotStyleMap } from "./types";

/**
 * Badge component metadata.
 * Single source of truth for slot names, style shapes, and state keys.
 *
 * @remarks
 * This metadata is used by the styled() API to infer:
 * - Available slot names for styling
 * - Style property shapes per slot
 * - State keys for pseudo selectors (none for Badge)
 */
export const BADGE_META = {
  /** Reconciler intrinsic tag used by every adapter to register the Renderable. */
  tag: "otui-badge",
  /**
   * Ordered tuple of slot names.
   * Used for slot-based styling: `{ root: {...} }`
   */
  slots: BADGE_SLOTS,

  /**
   * Type carrier for slot style shapes.
   * The runtime value is empty; the type carries the style interface.
   */
  slotStyleMap: {} as BadgeSlotStyleMap,

  /**
   * Ordered tuple of state keys.
   * Badge has no interactive state, so this is empty.
   */
  stateKeys: [] as const,
} as const;

/**
 * Type alias for the badge metadata shape.
 * Useful for generic constraints and type extraction.
 */
export type BadgeMeta = typeof BADGE_META;

/**
 * Type alias for the badge state keys tuple (empty).
 */
export type BadgeStateKeys = typeof BADGE_META.stateKeys;
