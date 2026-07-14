import { STATE_SELECTOR_PREFIX } from "./symbols";
import type {
  CompoundVariant,
  DefaultVariants,
  ProcessedRecipeConfig,
  RecipeConfiguration,
  RecipeVariants,
  ResolvedStyleSlots,
  SlotStyleSet,
} from "./types";

// =============================================================================
// Config Processing
// =============================================================================

/**
 * Process a styled config at definition time.
 * Normalizes the config structure for efficient runtime resolution.
 *
 * @param config - Raw styled config
 * @param stateKeys - Component's state keys tuple
 * @returns Processed config ready for runtime resolution
 */
export function processRecipeConfiguration<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  config: RecipeConfiguration<SlotStyleMap, StateKeys, V>,
  stateKeys: StateKeys,
): ProcessedRecipeConfig<SlotStyleMap, StateKeys, V> {
  const variants = config.variants ?? ({} as V);
  return {
    base: config.base ?? ({} as SlotStyleSet<SlotStyleMap, StateKeys>),
    variants,
    compoundVariants: config.compoundVariants ?? [],
    defaultVariants: config.defaultVariants ?? ({} as DefaultVariants<V>),
    stateKeys,
    // Pre-compute Set for O(1) lookup in splitVariantProps
    variantNameSet: new Set(Object.keys(variants)),
  };
}

// =============================================================================
// Style Resolution
// =============================================================================

/**
 * Resolve styles at runtime given component state and variant props.
 *
 * Resolution order (later wins):
 * 1. Base styles (with state selector application)
 * 2. Variant styles (with state selector application)
 * 3. Compound variant styles (with state selector application)
 * 4. Inline styles (with state selector application)
 *
 * State selectors are applied at each layer, so later layers can override
 * earlier state selector results. This ensures variants can override base
 * state styles without needing to re-specify every state selector.
 *
 * @param processed - Processed styled config
 * @param state - Current component state (e.g., { checked: true, focused: false })
 * @param variantProps - Variant prop values (e.g., { intent: "warning", size: "lg" })
 * @param inlineStyles - Optional inline styles override
 * @returns Resolved flat slot styles (selectors applied)
 */
export function resolveRecipeStyles<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  processed: ProcessedRecipeConfig<SlotStyleMap, StateKeys, V>,
  state: Partial<Record<StateKeys[number], boolean>>,
  variantProps: Partial<Record<keyof V, string>>,
  inlineStyles?: SlotStyleSet<SlotStyleMap, StateKeys>,
): ResolvedStyleSlots<SlotStyleMap> {
  // Accumulator for resolved styles. See "Internal: Style Layer Application" below.
  const result: Record<string, Record<string, unknown>> = {};

  // Layer 1: Base styles
  applyLayerStyles(result, processed.base, state, processed.stateKeys);

  // Layer 2: Variant styles
  // Optimization: avoid spread when variantProps is empty (common case with defaultVariants)
  const hasVariantProps = Object.keys(variantProps).length > 0;
  const effectiveVariants = hasVariantProps
    ? ({ ...processed.defaultVariants, ...variantProps } as Record<
        string,
        string | undefined
      >)
    : (processed.defaultVariants as Record<string, string | undefined>);

  for (const variantName in processed.variants) {
    if (!Object.hasOwn(processed.variants, variantName)) continue;

    const variantValue = effectiveVariants[variantName];
    if (variantValue === undefined) continue;

    const variantDefinition = processed.variants[variantName];
    const variantStyles = variantDefinition?.[variantValue];
    if (variantStyles) {
      applyLayerStyles(result, variantStyles, state, processed.stateKeys);
    }
  }

  // Layer 3: Compound variants
  for (const compoundVariant of processed.compoundVariants) {
    if (compoundVariantMatches(compoundVariant, effectiveVariants)) {
      applyLayerStyles(
        result,
        compoundVariant.styles,
        state,
        processed.stateKeys,
      );
    }
  }

  // Layer 4: Inline style overrides
  if (inlineStyles) {
    applyLayerStyles(result, inlineStyles, state, processed.stateKeys);
  }

  return result as ResolvedStyleSlots<SlotStyleMap>;
}

// =============================================================================
// Internal: Style Layer Application
// =============================================================================
//
// ARCHITECTURE NOTE:
// The functions below use a mutation-based accumulator pattern for performance.
// Rather than creating intermediate objects at each style layer via spread
// operators, we accumulate into a single result object.
//
// This is purely an internal optimization.
//
// =============================================================================

/**
 * Check if a compound variant's conditions all match the current variant props.
 * Returns false if there are no conditions (only a `styles` key).
 */
function compoundVariantMatches<
  V extends RecipeVariants<Record<string, object>, readonly string[]>,
>(
  compoundVariant: CompoundVariant<
    V,
    Record<string, object>,
    readonly string[]
  >,
  effectiveVariants: Record<string, string | undefined>,
): boolean {
  let hasConditions = false;

  for (const key in compoundVariant) {
    if (!Object.hasOwn(compoundVariant, key)) continue;
    if (key === "styles") continue;

    hasConditions = true;
    const requiredValue = compoundVariant[key as keyof typeof compoundVariant];
    const actualValue = effectiveVariants[key];

    // All conditions must match
    if (requiredValue !== actualValue) {
      return false;
    }
  }

  // Only match if there were actual conditions to check
  return hasConditions;
}

/**
 * Applies a style layer to the result, resolving state selectors for each slot.
 *
 * A "layer" represents one source of styles in the resolution order:
 * base styles, a variant's styles, a compound variant's styles, or inline styles.
 *
 * @internal Mutates `result` in place. See architecture note above.
 */
function applyLayerStyles<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
>(
  result: Record<string, Record<string, unknown>>,
  slotStyles: SlotStyleSet<SlotStyleMap, StateKeys>,
  state: Partial<Record<StateKeys[number], boolean>>,
  stateKeys: StateKeys,
): void {
  for (const slotName in slotStyles) {
    if (!Object.hasOwn(slotStyles, slotName)) continue;

    const slotStyle = slotStyles[slotName as keyof SlotStyleMap];
    if (slotStyle === undefined) continue;

    // Get or create the slot's style object
    let slot = result[slotName];
    if (!slot) {
      slot = {};
      result[slotName] = slot;
    }

    flattenSlotStyle(
      slot,
      slotStyle as Record<string, unknown>,
      state,
      stateKeys,
    );
  }
}

/**
 * Flattens a slot's conditional styles into the result based on current state.
 *
 * "Flattening" means:
 * 1. Copy all base properties (non-selector keys like `color`, `backgroundColor`)
 * 2. For each active state selector (`:checked`, `:focused`, etc.), merge its styles
 *
 * The order of state keys matters - later selectors override earlier ones.
 *
 * @internal Mutates `result` in place. See architecture note above.
 */
function flattenSlotStyle<StateKeys extends readonly string[]>(
  result: Record<string, unknown>,
  slotStyle: Record<string, unknown>,
  state: Partial<Record<StateKeys[number], boolean>>,
  stateKeys: StateKeys,
): void {
  // First, copy all non-selector properties
  for (const key in slotStyle) {
    if (
      Object.hasOwn(slotStyle, key) &&
      !key.startsWith(STATE_SELECTOR_PREFIX)
    ) {
      const value = slotStyle[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  // Then, apply matching state selectors in declaration order
  for (const stateKey of stateKeys) {
    if (state[stateKey as StateKeys[number]] !== true) continue;

    const selectorStyle = slotStyle[`${STATE_SELECTOR_PREFIX}${stateKey}`];
    if (
      selectorStyle === undefined ||
      typeof selectorStyle !== "object" ||
      selectorStyle === null
    ) {
      continue;
    }

    // Merge selector styles into result
    for (const prop in selectorStyle) {
      if (Object.hasOwn(selectorStyle, prop)) {
        const value = (selectorStyle as Record<string, unknown>)[prop];
        if (value !== undefined) {
          result[prop] = value;
        }
      }
    }
  }
}
