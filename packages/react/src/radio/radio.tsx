import {
  RADIO_GROUP_META,
  RADIO_META,
  type RadioGroupOptions,
  RadioGroupRenderable,
  type RadioGroupSlotStyleMap,
  type RadioGroupSlots,
  type RadioOptions,
  RadioRenderable,
  type RadioSlotStyleMap,
  type RadioSlots,
} from "@opentui-ui/core/radio";
import type { ReactNode } from "react";
import { createOtuiComponent } from "../createOtuiComponent";

export type RadioProps = RadioOptions;
export type RadioGroupProps = RadioGroupOptions & { children?: ReactNode };

export const Radio = createOtuiComponent<
  RadioProps,
  RadioSlots,
  RadioSlotStyleMap,
  typeof RADIO_META.stateKeys
>(RadioRenderable, RADIO_META);

export const RadioGroup = createOtuiComponent<
  RadioGroupProps,
  RadioGroupSlots,
  RadioGroupSlotStyleMap,
  typeof RADIO_GROUP_META.stateKeys
>(RadioGroupRenderable, RADIO_GROUP_META);
