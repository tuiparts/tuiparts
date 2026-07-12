import {
  BADGE_META,
  type BadgeOptions,
  BadgeRenderable,
  type BadgeSlotStyleMap,
  type BadgeSlots,
} from "@opentui-ui/core/badge";
import { createOtuiComponent } from "../createOtuiComponent";

export type BadgeProps = BadgeOptions;

export const Badge = createOtuiComponent<
  BadgeProps,
  BadgeSlots,
  BadgeSlotStyleMap,
  typeof BADGE_META.stateKeys
>(BadgeRenderable, BADGE_META);
