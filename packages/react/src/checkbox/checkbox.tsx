import {
  CHECKBOX_META,
  type CheckboxBaseOptions,
  CheckboxRenderable,
  type CheckboxSlotStyleMap,
  type CheckboxSlots,
} from "@opentui-ui/core/checkbox";
import { createOtuiComponent } from "../createOtuiComponent";

export type CheckboxProps = CheckboxBaseOptions & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox = createOtuiComponent<
  CheckboxProps,
  CheckboxSlots,
  CheckboxSlotStyleMap,
  typeof CHECKBOX_META.stateKeys
>(CheckboxRenderable, CHECKBOX_META);
