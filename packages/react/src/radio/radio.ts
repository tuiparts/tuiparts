// Curation shim, not drift: primitive.ts also exports RadioGroup (consumed by
// react/src/radio-group), which must stay out of the Radio namespace.
export { Indicator, Root } from "./primitive";
