import type {
  RadioGroupOptions,
  RadioGroupSlotStyleMap,
  RadioOptions,
  RadioSlotStyleMap,
  RadioSymbolSet,
} from "./types";

// =============================================================================
// Radio
// =============================================================================

export const RADIO_SLOTS = ["box", "mark", "label"] as const;

export const RADIO_SLOT_STYLE_MAP: RadioSlotStyleMap = {
  box: {},
  mark: {},
  label: {},
};

export const RADIO_SYMBOLS = {
  CIRCLE: { selected: "●", unselected: "○" },
  DOT: { selected: "•", unselected: "·" },
  ASCII: { selected: "(*)", unselected: "( )" },
  FILLED: { selected: "◉", unselected: "○" },
} as const satisfies Record<string, RadioSymbolSet>;

export const DEFAULT_RADIO_OPTIONS = {
  label: "",
  selected: false,
  symbols: RADIO_SYMBOLS.CIRCLE,
} as const satisfies Partial<RadioOptions>;

// =============================================================================
// RadioGroup
// =============================================================================

export const RADIO_GROUP_SLOTS = ["root"] as const;

export const RADIO_GROUP_SLOT_STYLE_MAP: RadioGroupSlotStyleMap = {
  root: {},
};

export const DEFAULT_RADIO_GROUP_OPTIONS =
  {} as const satisfies Partial<RadioGroupOptions>;
