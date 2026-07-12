import {
  $$OtuiComponentMeta,
  $$StyledBase,
  $$StyledComponent,
  $$StyledConfig,
  type ComponentMeta,
  type ComponentWithMeta,
  createStyled,
  createStyleResolver,
  type ExtractSlotStyleMap,
  type ExtractStateKeys,
  getVariantNames,
  processStyledProps,
  type ResolveStyledBase,
  type StyledConfig,
  type StyledSlotStyles,
  type VariantProps,
  type VariantsConfig,
} from "@opentui-ui/styles";
import { type ReactElement, useMemo } from "react";

// =============================================================================
// Types
// =============================================================================

type ComponentPropsOf<C> = C extends (props: infer P) => ReactElement
  ? P
  : never;

type StyledComponentProps<
  BaseComponent extends ComponentWithMeta<
    readonly string[],
    Record<string, object>,
    readonly string[]
  >,
  V extends VariantsConfig<
    ExtractSlotStyleMap<BaseComponent>,
    ExtractStateKeys<BaseComponent>
  >,
> = Omit<ComponentPropsOf<BaseComponent>, "styles" | "styleResolver"> &
  VariantProps<V> & {
    /**
     * Inline style overrides with state selector support.
     * Applied after styled config but before styleResolver.
     *
     * Note: For optimal performance, memoize this prop if passing dynamic objects:
     * ```tsx
     * const styles = useMemo(() => ({ label: { color: "red" } }), []);
     * <MyCheckbox styles={styles} />
     * ```
     */
    styles?: StyledSlotStyles<
      ExtractSlotStyleMap<BaseComponent>,
      ExtractStateKeys<BaseComponent>
    >;
  };

/**
 * A styled React component with variant props.
 *
 * Carries the same composition markers as the framework-agnostic
 * `StyledComponentDefinition` so `styled(styled(C, A), B)` correctly merges
 * configs and renders directly against the deepest `C`.
 */
interface StyledReactComponent<
  BaseComponent extends ComponentWithMeta<
    readonly string[],
    Record<string, object>,
    readonly string[]
  >,
  V extends VariantsConfig<
    ExtractSlotStyleMap<BaseComponent>,
    ExtractStateKeys<BaseComponent>
  >,
> {
  (props: StyledComponentProps<BaseComponent, V>): ReactElement;
  [$$OtuiComponentMeta]: ComponentMeta<
    readonly string[],
    ExtractSlotStyleMap<BaseComponent>,
    ExtractStateKeys<BaseComponent>
  >;
  [$$StyledComponent]: true;
  [$$StyledConfig]: ReturnType<
    typeof createStyled<BaseComponent, V>
  >["processed"];
  [$$StyledBase]: ResolveStyledBase<BaseComponent>;
  displayName?: string;
}

// =============================================================================
// styled() Function
// =============================================================================

/**
 * Creates a styled React component with type-safe variants.
 *
 * @param Component - Base headless component with OTUI metadata
 * @param config - Styled configuration with base, variants, etc.
 * @returns A styled React component with variant props
 *
 * @example
 * ```tsx
 * import { styled } from "@opentui-ui/react/styled";
 * import { Checkbox } from "@opentui-ui/react/checkbox";
 *
 * const MyCheckbox = styled(Checkbox, {
 *   base: {
 *     box: { backgroundColor: "transparent" },
 *     mark: { color: "blue" },
 *     label: { color: "white" },
 *   },
 *   variants: {
 *     intent: {
 *       warning: { mark: { color: "orange" } },
 *       danger: { mark: { color: "red" } },
 *     },
 *   },
 *   defaultVariants: { intent: "warning" },
 * });
 *
 * // Usage - variant props are fully typed
 * <MyCheckbox intent="danger" checked />
 * ```
 */
export function styled<
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
): StyledReactComponent<BaseComponent, V> {
  const styledDef = createStyled(Component, config);
  const variantNames = getVariantNames(styledDef.processed);

  // Render via the deepest base resolved by `createStyled` — bypasses any
  // intermediate styled wrappers under composition so they don't rebuild a
  // stale resolver from the inner config.
  const BaseComp = styledDef.component as unknown as (
    props: Record<string, unknown>,
  ) => ReactElement;

  function StyledComponent(
    props: StyledComponentProps<BaseComponent, V>,
  ): ReactElement {
    const { forwardProps, variantValues, inlineStyles, variantDeps } =
      processStyledProps(
        props as Record<string, unknown>,
        styledDef.processed,
        variantNames,
      );

    // Memoize the resolver. `variantDeps` is a stable-ordered array of the
    // string-coerced variant values; `inlineStyles` participates by reference.
    // biome-ignore lint/correctness/useExhaustiveDependencies: variantDeps is the actual dependency surface
    const styleResolver = useMemo(
      () =>
        createStyleResolver(styledDef.processed, variantValues, inlineStyles),
      [...variantDeps, inlineStyles],
    );

    return BaseComp({ ...forwardProps, styleResolver });
  }

  const Result = StyledComponent as StyledReactComponent<BaseComponent, V>;
  Result[$$OtuiComponentMeta] = styledDef[$$OtuiComponentMeta];
  Result[$$StyledComponent] = true;
  Result[$$StyledConfig] = styledDef.processed;
  Result[$$StyledBase] =
    styledDef.component as unknown as ResolveStyledBase<BaseComponent>;

  const baseName = (Component as { name?: string }).name || "Component";
  Result.displayName = `Styled(${baseName})`;

  return Result;
}
