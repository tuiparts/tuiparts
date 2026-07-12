import type { ButtonOptions, ButtonSlotStyleMap } from "./types";

export const BUTTON_SLOTS = ["root", "label"] as const;

export const BUTTON_SLOT_STYLE_MAP: ButtonSlotStyleMap = {
  root: {},
  label: {},
};

export const DEFAULT_BUTTON_OPTIONS = {
  label: "",
} as const satisfies Partial<ButtonOptions>;
