import type { InputOptions, InputSlotStyleMap } from "./types";

export const INPUT_SLOTS = ["root"] as const;

export const INPUT_SLOT_STYLE_MAP: InputSlotStyleMap = {
  root: {},
};

export const DEFAULT_INPUT_OPTIONS = {
  defaultValue: "",
  placeholder: "",
} as const satisfies Partial<InputOptions>;
