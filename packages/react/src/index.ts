// Re-export slot constants for convenience
export { BADGE_SLOTS, type BadgeSlotStyleMap } from "@opentui-ui/core/badge";
export {
  BUTTON_SLOTS,
  type ButtonSlotStyleMap,
} from "@opentui-ui/core/button";
export {
  RADIO_GROUP_SLOTS,
  RADIO_SLOTS,
  type RadioGroupSlotStyleMap,
  type RadioSlotStyleMap,
} from "@opentui-ui/core/radio";
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
