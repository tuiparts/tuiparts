// Re-export slot constants for convenience
export { BADGE_SLOTS, type BadgeSlotStyleMap } from "@opentui-ui/core/badge";
export {
  BUTTON_SLOTS,
  type ButtonSlotStyleMap,
} from "@opentui-ui/core/button";
export {
  CHECKBOX_SLOTS,
  type CheckboxSlotStyleMap,
} from "@opentui-ui/core/checkbox";
export {
  INPUT_SLOTS,
  type InputSlotStyleMap,
} from "@opentui-ui/core/input";
export {
  RADIO_GROUP_SLOTS,
  RADIO_SLOTS,
  type RadioGroupSlotStyleMap,
  type RadioSlotStyleMap,
} from "@opentui-ui/core/radio";
export {
  SWITCH_SLOTS,
  type SwitchSlotStyleMap,
} from "@opentui-ui/core/switch";
// Re-export components
export * from "./badge";
export * from "./button";
export * from "./checkbox";
export * from "./dialog";
// Wrapper factory (build new components without hand-writing extend()/meta wiring).
// Side-effect free; safe in the main entry.
export { createOtuiComponent } from "./createOtuiComponent";
export * from "./input";
export * from "./radio";
export * from "./switch";
