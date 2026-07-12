import {
  BUTTON_META,
  type ButtonOptions,
  ButtonRenderable,
  type ButtonSlotStyleMap,
  type ButtonSlots,
} from "@opentui-ui/core/button";
import { createOtuiComponent } from "../createOtuiComponent";

export type ButtonProps = ButtonOptions;

export const Button = createOtuiComponent<
  ButtonProps,
  ButtonSlots,
  ButtonSlotStyleMap,
  typeof BUTTON_META.stateKeys
>(ButtonRenderable, BUTTON_META);
