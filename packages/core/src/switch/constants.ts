import type {
  SwitchOptions,
  SwitchSlotStyleMap,
  SwitchSymbolSet,
} from "./types";

export const SWITCH_SLOTS = ["track", "thumb", "label"] as const;

export const SWITCH_SLOT_STYLE_MAP: SwitchSlotStyleMap = {
  track: {},
  thumb: {},
  label: {},
};

export const SWITCH_SYMBOLS = {
  ROUND: { thumb: "●", track: "─" },
  BLOCK: { thumb: "█", track: "░" },
  ASCII: { thumb: "*", track: "-" },
  DOT: { thumb: "•", track: " " },
} as const satisfies Record<string, SwitchSymbolSet>;

export const DEFAULT_SWITCH_OPTIONS = {
  label: "",
  checked: false,
  symbols: SWITCH_SYMBOLS.ROUND,
} as const satisfies Partial<SwitchOptions>;

export const DEFAULT_TRACK_SIZE = 4;
export const DEFAULT_TRACK_GAP = 1;
