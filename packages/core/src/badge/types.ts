import type { BoxOptions, BoxRenderable, TextOptions } from "@opentui/core";
import type {
  StyleableSubset,
  StyledOptions,
  TextStyleableSubset,
} from "../styled-renderable";
import type { BADGE_SLOTS } from "./constants";

export type BadgeSlots = typeof BADGE_SLOTS;

export type BadgeState = Record<string, never>;

/**
 * Slot styles for Badge. `root` accepts every property opentui's
 * `BoxRenderable` exposes; `label` accepts every property
 * `TextRenderable` exposes — minus identity / lifecycle / per-instance
 * event handlers (see {@link StyleableSubset}).
 */
export type BadgeSlotStyleMap = {
  root: StyleableSubset<BoxOptions>;
  label: TextStyleableSubset<TextOptions>;
};

export type BadgeSlotStyles = BadgeSlotStyleMap;

export type BadgeSlotStyleResolver = (state: BadgeState) => BadgeSlotStyles;

export interface BadgeOptions
  extends StyledOptions<BadgeState, BadgeSlotStyles, BoxRenderable> {
  label?: string;
  styles?: BadgeSlotStyles;
}
