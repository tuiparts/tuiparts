export { BADGE_SLOTS, type BadgeSlotStyleMap } from "@opentui-ui/core/badge";
// Re-export components
export * from "./badge";
export * from "./button";
export * from "./checkbox";
// Wrapper factory (build new components without hand-writing extend()/meta
// wiring). Side-effect free; safe in the main entry.
export { createOtuiComponent } from "./createOtuiComponent";
export * from "./dialog";
export * from "./input";
export * from "./radio";
export * from "./radio-group";
export * from "./switch";
