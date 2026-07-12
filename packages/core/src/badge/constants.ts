import type { BadgeOptions, BadgeSlotStyleMap } from "./types";

export const BADGE_SLOTS = ["root", "label"] as const;

export const BADGE_SLOT_STYLE_MAP: BadgeSlotStyleMap = {
  root: {},
  label: {},
};

export const DEFAULT_BADGE_OPTIONS = {
  label: "",
} as const satisfies Partial<BadgeOptions>;
