import {
  SWITCH_META,
  type SwitchBaseOptions,
  SwitchRenderable,
  type SwitchSlotStyleMap,
  type SwitchSlots,
} from "@opentui-ui/core/switch";
import { createOtuiComponent } from "../createOtuiComponent";

export type SwitchProps = SwitchBaseOptions & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export const Switch = createOtuiComponent<
  SwitchProps,
  SwitchSlots,
  SwitchSlotStyleMap,
  typeof SWITCH_META.stateKeys
>(SwitchRenderable, SWITCH_META);
