import {
  RADIO_META,
  type RadioOptions,
  RadioRenderable,
  type RadioSlotStyleMap,
  type RadioSlots,
} from "@opentui-ui/core/radio";
import { createOtuiComponent } from "../createOtuiComponent";

type RadioProps = RadioOptions;

export const Radio = createOtuiComponent<
  RadioProps,
  RadioSlots,
  RadioSlotStyleMap,
  typeof RADIO_META.stateKeys
>(RadioRenderable, RADIO_META);

export namespace Radio {
  export type Props = RadioProps;
  export type State = import("@opentui-ui/core/radio").RadioState;
}
