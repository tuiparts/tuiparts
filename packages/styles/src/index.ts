/**
 * @opentui-ui/styles
 *
 * Styling engine for OpenTUI UI components.
 * Provides a Stitches-inspired styled() API with type-safe variants,
 * composition, and state-driven pseudo selectors.
 *
 * @packageDocumentation
 */

// =============================================================================
// Symbols
// =============================================================================

export {
  $$OtuiComponentMeta,
  type $$OtuiComponentMeta as $$OtuiComponentMetaType,
  $$StyledBase,
  type $$StyledBase as $$StyledBaseType,
  $$StyledComponent,
  type $$StyledComponent as $$StyledComponentType,
  $$StyledConfig,
  type $$StyledConfig as $$StyledConfigType,
} from "./symbols";

// =============================================================================
// Types
// =============================================================================

export type {
  // Component Metadata
  ComponentMeta,
  CompoundVariant,
  // Slot Styles
  ConditionalSlotStyle,
  DefaultVariants,
  ExtractMeta,
  ExtractSlotStyleMap,
  ExtractSlots,
  ExtractStateKeys,
  ProcessedStyledConfig,
  ResolvedSlotStyles,
  // State Selectors
  StateSelector,
  StateSelectorStyles,
  // Styled Component
  StyledComponentMarker,
  // Styled Config
  StyledConfig,
  StyledSlotStyles,
  // Variants
  VariantDefinition,
  VariantProps,
  VariantsConfig,
} from "./types";

// =============================================================================
// Type Guards
// =============================================================================

export { hasComponentMeta } from "./types";

// =============================================================================
// Merge Utilities
// =============================================================================

export {
  mergeSlotStyles,
  mergeStyle,
  mergeStyledConfig,
} from "./merge";

// =============================================================================
// Resolution Engine
// =============================================================================

export {
  createStyleResolver,
  processStyledConfig,
  resolveStyles,
} from "./resolve";

// =============================================================================
// Styled Factory
// =============================================================================

export {
  type ComponentWithMeta,
  createStyled,
  getVariantNames,
  isStyledComponentDefinition,
  type ProcessedStyledProps,
  processStyledProps,
  type ResolveStyledBase,
  type StyledComponentDefinition,
  splitVariantProps,
} from "./styled";
