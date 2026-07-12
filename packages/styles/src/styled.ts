import { mergeStyledConfig } from "./merge";
import { createStyleResolver, processStyledConfig } from "./resolve";
import {
  $$OtuiComponentMeta,
  $$StyledBase,
  $$StyledComponent,
  $$StyledConfig,
} from "./symbols";
import type {
  ComponentMeta,
  ExtractSlotStyleMap,
  ExtractStateKeys,
  ProcessedStyledConfig,
  StyledConfig,
  StyledSlotStyles,
  VariantProps,
  VariantsConfig,
} from "./types";

// =============================================================================
// Styled Component Definition Types
// =============================================================================

/**
 * A component that has OTUI component metadata attached.
 */
export interface ComponentWithMeta<
  Slots extends readonly string[],
  SlotStyleMap extends Record<Slots[number], object>,
  StateKeys extends readonly string[],
> {
  [$$OtuiComponentMeta]: ComponentMeta<Slots, SlotStyleMap, StateKeys>;
}

/**
 * Resolves the deepest underlying `ComponentWithMeta` reachable from a
 * (possibly styled) input — mirrors the runtime behaviour of
 * `resolveStyledBase`. Used so `createStyled`'s return type points to the
 * underlying base, not an intermediate wrapper.
 */
export type ResolveStyledBase<C> = C extends { [$$StyledBase]: infer B }
  ? B extends ComponentWithMeta<
      readonly string[],
      Record<string, object>,
      readonly string[]
    >
    ? B
    : C
  : C;

/**
 * A styled component with attached config and variant props.
 *
 * `component` and `[$$StyledBase]` both point to the **deepest** underlying
 * `ComponentWithMeta` reachable through composition. Framework wrappers render
 * via `component` to bypass any intermediate styled wrappers — this is what
 * makes `styled(styled(C, A), B)` collapse to a single `C` call with the
 * merged A+B resolver.
 */
export interface StyledComponentDefinition<
  BaseComponent extends ComponentWithMeta<
    readonly string[],
    Record<string, object>,
    readonly string[]
  >,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends VariantsConfig<SlotStyleMap, StateKeys>,
> {
  /** The deepest base component reachable through composition */
  component: BaseComponent;
  /** Processed styled config */
  processed: ProcessedStyledConfig<SlotStyleMap, StateKeys, V>;
  /** Original config (for composition) */
  config: StyledConfig<SlotStyleMap, StateKeys, V>;
  /** Marker for styled component detection */
  [$$StyledComponent]: true;
  /** Stored config for composition */
  [$$StyledConfig]: ProcessedStyledConfig<SlotStyleMap, StateKeys, V>;
  /** Deepest base for rendering — same value as `component` */
  [$$StyledBase]: BaseComponent;
  /** Component metadata (forwarded from base) */
  [$$OtuiComponentMeta]: ComponentMeta<
    readonly string[],
    SlotStyleMap,
    StateKeys
  >;
}

// =============================================================================
// Styled Factory
// =============================================================================

/**
 * Resolve the deepest underlying `ComponentWithMeta` reachable from `value`,
 * walking through styled wrappers via `[$$StyledBase]` (set by both
 * `createStyled` and the framework `styled()` wrappers).
 */
function resolveStyledBase<C>(value: C): C {
  if (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    $$StyledBase in (value as object)
  ) {
    return (value as unknown as Record<typeof $$StyledBase, C>)[$$StyledBase];
  }
  return value;
}

/**
 * Creates a styled component definition.
 * This is the framework-agnostic core of the styled() API.
 *
 * The returned definition contains:
 * - The base component
 * - Processed config for runtime resolution
 * - Metadata for type inference and composition
 *
 * Framework wrappers (React, Solid) use this to create actual components.
 *
 * @param Component - Base component with OTUI metadata
 * @param config - Styled config with base, variants, etc.
 * @returns Styled component definition
 */
export function createStyled<
  BaseComponent extends ComponentWithMeta<
    readonly string[],
    Record<string, object>,
    readonly string[]
  >,
  V extends VariantsConfig<
    ExtractSlotStyleMap<BaseComponent>,
    ExtractStateKeys<BaseComponent>
  >,
>(
  Component: BaseComponent,
  config: StyledConfig<
    ExtractSlotStyleMap<BaseComponent>,
    ExtractStateKeys<BaseComponent>,
    V
  >,
): StyledComponentDefinition<
  ResolveStyledBase<BaseComponent>,
  ExtractSlotStyleMap<BaseComponent>,
  ExtractStateKeys<BaseComponent>,
  V
> {
  type SlotStyleMap = ExtractSlotStyleMap<BaseComponent>;
  type StateKeys = ExtractStateKeys<BaseComponent>;

  // Get component metadata with guard
  const meta = Component[$$OtuiComponentMeta] as
    | ComponentMeta<readonly string[], SlotStyleMap, StateKeys>
    | undefined;

  if (!meta) {
    throw new Error(
      `styled() requires a component with OTUI metadata. ` +
        `Ensure the component has [$$OtuiComponentMeta] attached.`,
    );
  }

  // Resolve the deepest underlying base. For raw components this is `Component`
  // itself; for already-styled inputs it's their `[$$StyledBase]`.
  const underlyingBase = resolveStyledBase(Component);

  // If the input is itself styled, merge its previous processed config into
  // the new one so chained `styled()` calls accumulate base/variants/etc.
  let finalConfig: StyledConfig<SlotStyleMap, StateKeys, V>;

  if (isStyledComponentDefinition(Component)) {
    const baseConfig = Component[$$StyledConfig] as ProcessedStyledConfig<
      SlotStyleMap,
      StateKeys,
      VariantsConfig<SlotStyleMap, StateKeys>
    >;

    // Convert processed config back to regular config for merging
    const baseAsConfig: StyledConfig<
      SlotStyleMap,
      StateKeys,
      VariantsConfig<SlotStyleMap, StateKeys>
    > = {
      base: baseConfig.base,
      variants: baseConfig.variants,
      compoundVariants: baseConfig.compoundVariants,
      defaultVariants: baseConfig.defaultVariants,
    };

    finalConfig = mergeStyledConfig(baseAsConfig, config) as StyledConfig<
      SlotStyleMap,
      StateKeys,
      V
    >;
  } else {
    finalConfig = config;
  }

  // Process the config
  const processed = processStyledConfig(
    finalConfig,
    meta.stateKeys as StateKeys,
  );

  return {
    component: underlyingBase,
    processed,
    config: finalConfig,
    [$$StyledComponent]: true,
    [$$StyledConfig]: processed,
    [$$StyledBase]: underlyingBase,
    [$$OtuiComponentMeta]: meta,
  } as StyledComponentDefinition<
    ResolveStyledBase<BaseComponent>,
    SlotStyleMap,
    StateKeys,
    V
  >;
}

/**
 * Type guard to check if a value is a styled component (or styled definition).
 *
 * Recognises both the framework-agnostic `StyledComponentDefinition` and the
 * framework-specific component returned by `react/solid` `styled()` — both
 * carry `[$$StyledComponent]` and `[$$StyledConfig]`.
 */
export function isStyledComponentDefinition(
  value: unknown,
): value is StyledComponentDefinition<
  ComponentWithMeta<
    readonly string[],
    Record<string, object>,
    readonly string[]
  >,
  Record<string, object>,
  readonly string[],
  VariantsConfig<Record<string, object>, readonly string[]>
> {
  return (
    value !== null &&
    value !== undefined &&
    (typeof value === "object" || typeof value === "function") &&
    $$StyledComponent in (value as object) &&
    $$StyledConfig in (value as object)
  );
}

// =============================================================================
// Variant Props Extraction Utilities
// =============================================================================

/**
 * Splits props into variant props and forward props.
 * Variant props are consumed by the styled system.
 * Forward props are passed to the underlying component.
 *
 * @param props - All props passed to the styled component
 * @param variantNameSet - Pre-computed Set for O(1) lookup (from ProcessedStyledConfig.variantNameSet)
 * @returns Tuple of [variantProps, forwardProps]
 */
export function splitVariantProps<
  Props extends Record<string, unknown>,
  V extends VariantsConfig<Record<string, object>, readonly string[]>,
>(
  props: Props,
  variantNameSet: ReadonlySet<string>,
): [VariantProps<V>, Omit<Props, keyof V>] {
  const variantProps: Record<string, unknown> = {};
  const forwardProps: Record<string, unknown> = {};

  for (const key in props) {
    if (Object.hasOwn(props, key)) {
      if (variantNameSet.has(key)) {
        variantProps[key] = props[key];
      } else {
        forwardProps[key] = props[key];
      }
    }
  }

  return [
    variantProps as VariantProps<V>,
    forwardProps as Omit<Props, keyof V>,
  ];
}

/**
 * Gets the variant names from a processed config.
 */
export function getVariantNames<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends VariantsConfig<SlotStyleMap, StateKeys>,
>(processed: ProcessedStyledConfig<SlotStyleMap, StateKeys, V>): (keyof V)[] {
  return Array.from(processed.variantNameSet) as (keyof V)[];
}

// =============================================================================
// Shared per-render styled() logic
// =============================================================================
//
// Both the React and Solid `styled()` wrappers run the same algorithm at
// render time:
//   1. split variant props from forward props (key-based)
//   2. extract `styles` (inline override) from forward props
//   3. coerce variant values to strings (filter undefined / non-strings) so
//      they don't override `defaultVariants`
//   4. build a fresh `StyleResolver` from the processed config + variants +
//      inline styles
//
// `processStyledProps` does (1)–(3) as a pure function. Frameworks call it
// inside their reactivity primitive and pass the result to `createStyleResolver`.
// `variantDeps` is provided as a deterministic-ordered list so React's
// `useMemo` can use it as a dependency array; Solid ignores it.
//
// =============================================================================

export interface ProcessedStyledProps<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends VariantsConfig<SlotStyleMap, StateKeys>,
> {
  /** Props to forward to the underlying base, with `styles` removed. */
  forwardProps: Record<string, unknown>;
  /** Variant values filtered to strings (entries with non-string values dropped). */
  variantValues: Partial<Record<keyof V, string>>;
  /** Inline `styles` override pulled out of the input props. */
  inlineStyles: StyledSlotStyles<SlotStyleMap, StateKeys> | undefined;
  /**
   * Variant values in `variantNames` order, with non-strings represented as
   * `undefined`. Use as a dependency array for memoization.
   */
  variantDeps: (string | undefined)[];
}

/**
 * Pure shared helper for the per-render work the framework `styled()`
 * wrappers do. See the section comment above for the contract.
 */
export function processStyledProps<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends VariantsConfig<SlotStyleMap, StateKeys>,
>(
  props: Record<string, unknown>,
  processed: ProcessedStyledConfig<SlotStyleMap, StateKeys, V>,
  variantNames: readonly (keyof V)[],
): ProcessedStyledProps<SlotStyleMap, StateKeys, V> {
  const [, forwardWithStyles] = splitVariantProps(
    props,
    processed.variantNameSet,
  );

  const inlineStyles = (forwardWithStyles as Record<string, unknown>).styles as
    | StyledSlotStyles<SlotStyleMap, StateKeys>
    | undefined;

  const forwardProps: Record<string, unknown> = {};
  for (const key in forwardWithStyles) {
    if (key === "styles") continue;
    if (Object.hasOwn(forwardWithStyles, key)) {
      forwardProps[key] = (forwardWithStyles as Record<string, unknown>)[key];
    }
  }

  // Variants are string-only at runtime. Booleans/numbers passed as variant
  // props are dropped here so they don't override `defaultVariants` with
  // unmatchable values. (Kept as a contract — see README's variant section.)
  const variantValues: Partial<Record<keyof V, string>> = {};
  const variantDeps: (string | undefined)[] = [];
  for (const name of variantNames) {
    const raw = props[name as string];
    const value = typeof raw === "string" ? raw : undefined;
    variantDeps.push(value);
    if (value !== undefined) {
      variantValues[name] = value;
    }
  }

  return { forwardProps, variantValues, inlineStyles, variantDeps };
}

// Re-export so framework wrappers can import the resolver builder from one place.
export { createStyleResolver };
