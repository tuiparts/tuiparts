import {
  INPUT_META,
  type InputOptions,
  InputRenderable,
  type InputSlotStyleMap,
  type InputSlots,
} from "@opentui-ui/core/input";
import { createOtuiComponent } from "../createOtuiComponent";

export type InputProps = InputOptions;

export const Input = createOtuiComponent<
  InputProps,
  InputSlots,
  InputSlotStyleMap,
  typeof INPUT_META.stateKeys
>(InputRenderable, INPUT_META);
