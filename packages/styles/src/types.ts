// =============================================================================
// State Selector Types
// =============================================================================

/**
 * Creates a union of state selector strings from a tuple of state keys.
 * E.g., ["checked", "focused"] -> "_checked" | "_focused"
 */
export type StateSelector<K extends readonly string[]> = K extends readonly []
  ? never
  : `_${K[number]}`;

/**
 * Creates a record type for state selector keys with style values.
 * Empty tuple results in empty object (no selectors).
 */
export type StateSelectorStyles<
  Style extends object,
  StateKeys extends readonly string[],
> = StateKeys extends readonly []
  ? Record<never, never>
  : {
      [K in StateSelector<StateKeys>]?: Style;
    };

// =============================================================================
// Slot Style Types
// =============================================================================

/**
 * A single slot's style with optional state selectors.
 * E.g., { color: "white", _checked: { color: "green" } }
 */
export type ConditionalSlotStyle<
  Style extends object,
  StateKeys extends readonly string[],
> = Partial<Style> & StateSelectorStyles<Partial<Style>, StateKeys>;

/**
 * Full slot styles for all slots, each supporting state selectors.
 * E.g., { root: { color: "white", _checked: { color: "green" } }, label: { color: "gray" } }
 */
export type SlotStyleSet<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> = {
  [Slot in keyof SlotStyleMap]?: ConditionalSlotStyle<
    SlotStyleMap[Slot],
    StateKeys
  >;
};

// =============================================================================
// Variant Types
// =============================================================================

/**
 * Definition for a single variant (e.g., intent, size).
 * Maps variant values to slot styles.
 */
export type VariantDefinition<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> = {
  [VariantValue: string]: SlotStyleSet<SlotStyleMap, StateKeys>;
};

/**
 * Full variants config mapping variant names to their definitions.
 */
export type RecipeVariants<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> = {
  [VariantName: string]: VariantDefinition<SlotStyleMap, StateKeys>;
};

/**
 * Compound variant definition - applies when multiple variant conditions match.
 *
 * Note: when `Variants` is open (`RecipeVariants<...>`), the mapped type
 * `[K in keyof Variants]?: keyof Variants[K]` widens to a string-indexed shape.
 * Intersecting that with `{ styles: ... }` would collapse the `styles` slot
 * into the string-indexed value type. We `Omit<..., "styles">` from the
 * variant-discriminator side so `styles` always survives as the precise
 * `SlotStyleSet` shape.
 */
export type CompoundVariant<
  Variants extends RecipeVariants<SlotStyleMap, StateKeys>,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> = Omit<{ [K in keyof Variants]?: keyof Variants[K] }, "styles"> & {
  /** Styles to apply when all variant conditions match */
  styles: SlotStyleSet<SlotStyleMap, StateKeys>;
};

/**
 * Default variants - specifies which variant value to use when not provided.
 */
export type DefaultVariants<Variants> = {
  [K in keyof Variants]?: keyof Variants[K];
};

// =============================================================================
// Recipe Config Types
// =============================================================================

/**
 * Full configuration for a style recipe.
 *
 * @typeParam SlotStyleMap - The component's slot style map
 * @typeParam StateKeys - The component's state keys tuple
 * @typeParam V - The variants config (inferred for type safety)
 */
export interface RecipeConfiguration<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> {
  /** Base styles applied to all instances */
  base?: SlotStyleSet<SlotStyleMap, StateKeys>;
  /** Variant definitions */
  variants?: V;
  /** Compound variants applied when multiple conditions match */
  compoundVariants?: CompoundVariant<V, SlotStyleMap, StateKeys>[];
  /** Default variant values when not specified via props */
  defaultVariants?: DefaultVariants<V>;
}

/**
 * Infers variant props from a variants config.
 * E.g., { intent: { warning: ..., danger: ... } } -> { intent?: "warning" | "danger" }
 */
export type VariantProps<V> = {
  [K in keyof V]?: keyof V[K];
};

// =============================================================================
// Processed Recipe Types
// =============================================================================

/**
 * Processed and normalized recipe config ready for runtime resolution.
 */
export interface ProcessedRecipeConfig<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> {
  /** Normalized base styles */
  base: SlotStyleSet<SlotStyleMap, StateKeys>;
  /** Normalized variants */
  variants: V;
  /** Compound variants array */
  compoundVariants: CompoundVariant<V, SlotStyleMap, StateKeys>[];
  /** Default variant values */
  defaultVariants: DefaultVariants<V>;
  /** State keys for selector matching */
  stateKeys: StateKeys;
  /** Pre-computed Set for O(1) variant name lookup in splitVariantProps */
  variantNameSet: ReadonlySet<string>;
}

// =============================================================================
// Component Type Extraction
// =============================================================================

/**
 * Resolves flat slot styles (selectors applied based on state).
 * This is the output type after style resolution.
 */
export type ResolvedStyleSlots<SlotStyleMap extends Record<string, object>> = {
  [Slot in keyof SlotStyleMap]?: Partial<SlotStyleMap[Slot]>;
};
