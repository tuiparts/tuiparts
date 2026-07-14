import { STATE_SELECTOR_PREFIX } from "./symbols";
import type {
  CompoundVariant,
  DefaultVariants,
  RecipeConfiguration,
  RecipeVariants,
  SlotStyleSet,
} from "./types";

// =============================================================================
// Style Merging Utilities
// =============================================================================

/**
 * Checks if a value is a plain object (not null, not array, not Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Shallow merge two style objects.
 * - `undefined` values in override are skipped (preserves base values)
 * - Other values in override replace base values
 *
 * @param base - Base style object
 * @param override - Override style object
 * @returns Merged style object
 *
 * @example
 * ```ts
 * mergeStyle({ color: "white", backgroundColor: "black" }, { color: "green" })
 * // => { color: "green", backgroundColor: "black" }
 *
 * mergeStyle({ color: "white" }, { color: undefined, backgroundColor: "blue" })
 * // => { color: "white", backgroundColor: "blue" }
 * ```
 */
export function mergeStyle<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base };

  for (const key in override) {
    if (Object.hasOwn(override, key)) {
      const value = override[key];
      // Skip undefined values - they don't override base
      if (value !== undefined) {
        result[key] = value as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Merge slot styles per-slot, handling state selectors.
 * Each slot's styles are shallow merged independently.
 *
 * @param base - Base slot styles
 * @param override - Override slot styles
 * @returns Merged slot styles
 *
 * @example
 * ```ts
 * mergeSlotStyles(
 *   { root: { color: "white" }, label: { color: "gray" } },
 *   { root: { color: "green", _checked: { color: "blue" } } }
 * )
 * // => {
 * //   root: { color: "green", _checked: { color: "blue" } },
 * //   label: { color: "gray" }
 * // }
 * ```
 */
export function mergeSlotStyles<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
>(
  base: SlotStyleSet<SlotStyleMap, StateKeys>,
  override: SlotStyleSet<SlotStyleMap, StateKeys>,
): SlotStyleSet<SlotStyleMap, StateKeys> {
  const result = { ...base } as SlotStyleSet<SlotStyleMap, StateKeys>;

  for (const slot in override) {
    if (Object.hasOwn(override, slot)) {
      const slotKey = slot as keyof typeof override;
      const baseSlot = base[slotKey];
      const overrideSlot = override[slotKey];

      if (overrideSlot === undefined) {
        continue;
      }

      if (baseSlot === undefined) {
        result[slotKey] = overrideSlot;
      } else {
        // Merge the slot's styles, including state selectors
        result[slotKey] = mergeSlotStyleWithSelectors(
          baseSlot as Record<string, unknown>,
          overrideSlot as Record<string, unknown>,
        ) as (typeof result)[typeof slotKey];
      }
    }
  }

  return result;
}

/**
 * Merge a single slot's styles including state selectors.
 * State selectors (`_checked`, etc.) are merged separately.
 */
function mergeSlotStyleWithSelectors(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // First, copy all base properties
  for (const key in base) {
    if (Object.hasOwn(base, key)) {
      const value = base[key];
      if (key.startsWith(STATE_SELECTOR_PREFIX) && isPlainObject(value)) {
        // State selector - will be merged later if override has it
        result[key] = { ...value };
      } else {
        result[key] = value;
      }
    }
  }

  // Then, merge override properties
  for (const key in override) {
    if (Object.hasOwn(override, key)) {
      const overrideValue = override[key];

      if (overrideValue === undefined) {
        continue;
      }

      if (
        key.startsWith(STATE_SELECTOR_PREFIX) &&
        isPlainObject(overrideValue)
      ) {
        // State selector - merge with base if exists
        const baseSelector = result[key];
        if (isPlainObject(baseSelector)) {
          result[key] = mergeStyle(
            baseSelector as Record<string, unknown>,
            overrideValue,
          );
        } else {
          result[key] = { ...overrideValue };
        }
      } else {
        // Regular property - override
        result[key] = overrideValue;
      }
    }
  }

  return result;
}

// =============================================================================
// Recipe Configuration Merging (for composition)
// =============================================================================

/**
 * Merge two styled configs for composition.
 *
 * Merge rules:
 * - `base`: Deep merge (override wins)
 * - `variants`: Merge by variant name (override extends/replaces values)
 * - `defaultVariants`: Shallow merge (override wins)
 * - `compoundVariants`: Append (override after base)
 *
 * @param baseConfig - Base styled config
 * @param overrideConfig - Override styled config
 * @returns Merged styled config
 *
 * @example
 * ```ts
 * // Base component
 * const base = {
 *   base: { root: { color: "white" } },
 *   variants: { intent: { primary: { root: { color: "blue" } } } },
 *   defaultVariants: { intent: "primary" }
 * };
 *
 * // Override
 * const override = {
 *   base: { root: { backgroundColor: "black" } },
 *   variants: { intent: { danger: { root: { color: "red" } } } },
 *   defaultVariants: { intent: "danger" }
 * };
 *
 * mergeRecipeConfiguration(base, override)
 * // => {
 * //   base: { root: { color: "white", backgroundColor: "black" } },
 * //   variants: {
 * //     intent: {
 * //       primary: { root: { color: "blue" } },
 * //       danger: { root: { color: "red" } }
 * //     }
 * //   },
 * //   defaultVariants: { intent: "danger" }
 * // }
 * ```
 */
export function mergeRecipeConfiguration<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V1 extends RecipeVariants<SlotStyleMap, StateKeys>,
  V2 extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  baseConfig: RecipeConfiguration<SlotStyleMap, StateKeys, V1>,
  overrideConfig: RecipeConfiguration<SlotStyleMap, StateKeys, V2>,
): RecipeConfiguration<SlotStyleMap, StateKeys, V1 & V2> {
  // Merge base styles
  const mergedBase = mergeSlotStyles<SlotStyleMap, StateKeys>(
    baseConfig.base ?? ({} as SlotStyleSet<SlotStyleMap, StateKeys>),
    overrideConfig.base ?? ({} as SlotStyleSet<SlotStyleMap, StateKeys>),
  );

  // Merge variants by name
  const mergedVariants = mergeVariants<SlotStyleMap, StateKeys, V1, V2>(
    baseConfig.variants,
    overrideConfig.variants,
  );

  // Shallow merge default variants (override wins)
  const mergedDefaultVariants = {
    ...baseConfig.defaultVariants,
    ...overrideConfig.defaultVariants,
  } as DefaultVariants<V1 & V2>;

  // Append compound variants
  const mergedCompoundVariants = [
    ...(baseConfig.compoundVariants ?? []),
    ...(overrideConfig.compoundVariants ?? []),
  ] as CompoundVariant<V1 & V2, SlotStyleMap, StateKeys>[];

  return {
    base: mergedBase,
    variants: mergedVariants,
    defaultVariants: mergedDefaultVariants,
    compoundVariants: mergedCompoundVariants,
  };
}

/**
 * Merge variants by variant name.
 * For each variant name, merge the variant values (override extends base).
 */
function mergeVariants<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V1 extends RecipeVariants<SlotStyleMap, StateKeys>,
  V2 extends RecipeVariants<SlotStyleMap, StateKeys>,
>(baseVariants: V1 | undefined, overrideVariants: V2 | undefined): V1 & V2 {
  if (!baseVariants && !overrideVariants) {
    return {} as V1 & V2;
  }
  if (!baseVariants) {
    return overrideVariants as V1 & V2;
  }
  if (!overrideVariants) {
    return baseVariants as V1 & V2;
  }

  const result = { ...baseVariants } as Record<string, Record<string, unknown>>;

  for (const variantName in overrideVariants) {
    if (Object.hasOwn(overrideVariants, variantName)) {
      const baseVariant = result[variantName];
      const overrideVariant = overrideVariants[variantName];

      if (!baseVariant) {
        // New variant name - add it
        result[variantName] = overrideVariant as Record<string, unknown>;
      } else {
        // Existing variant name - merge values
        result[variantName] = mergeVariantValues<SlotStyleMap, StateKeys>(
          baseVariant as Record<string, SlotStyleSet<SlotStyleMap, StateKeys>>,
          overrideVariant as Record<
            string,
            SlotStyleSet<SlotStyleMap, StateKeys>
          >,
        );
      }
    }
  }

  return result as V1 & V2;
}

/**
 * Merge variant values for a single variant name.
 * Each variant value's slot styles are merged.
 */
function mergeVariantValues<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
>(
  baseValues: Record<string, SlotStyleSet<SlotStyleMap, StateKeys>>,
  overrideValues: Record<string, SlotStyleSet<SlotStyleMap, StateKeys>>,
): Record<string, SlotStyleSet<SlotStyleMap, StateKeys>> {
  const result = { ...baseValues };

  for (const valueName in overrideValues) {
    if (Object.hasOwn(overrideValues, valueName)) {
      const baseValue = result[valueName];
      const overrideValue = overrideValues[valueName];

      // Skip undefined override values
      if (overrideValue === undefined) {
        continue;
      }

      if (!baseValue) {
        // New variant value - add it
        result[valueName] = overrideValue;
      } else {
        // Existing variant value - merge slot styles
        result[valueName] = mergeSlotStyles<SlotStyleMap, StateKeys>(
          baseValue,
          overrideValue,
        );
      }
    }
  }

  return result;
}
