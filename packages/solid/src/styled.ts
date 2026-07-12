import type { JSX } from "@opentui/solid";
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
  type ResolveStyledBase,
  type StyledConfig,
  type StyledSlotStyles,
  type VariantProps,
  type VariantsConfig,
} from "@opentui-ui/styles";
import { createMemo, mergeProps, splitProps } from "solid-js";

// =============================================================================
// Types
// =============================================================================

type ComponentPropsOf<C> = C extends (props: infer P) => JSX.Element
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
     */
    styles?: StyledSlotStyles<
      ExtractSlotStyleMap<BaseComponent>,
      ExtractStateKeys<BaseComponent>
    >;
  };

/**
 * A styled Solid component with variant props.
 *
 * Carries the same composition markers as the framework-agnostic
 * `StyledComponentDefinition` so chained `styled(styled(C, A), B)` correctly
 * merges configs and renders directly against the deepest `C`.
 */
interface StyledSolidComponent<
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
  (props: StyledComponentProps<BaseComponent, V>): JSX.Element;
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
}

// =============================================================================
// styled() Function
// =============================================================================

/**
 * Creates a styled Solid component with type-safe variants.
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
): StyledSolidComponent<BaseComponent, V> {
  const styledDef = createStyled(Component, config);
  const variantNames = getVariantNames(styledDef.processed);

  // Render via the deepest base resolved by `createStyled` — bypasses any
  // intermediate styled wrappers under composition so they don't rebuild a
  // stale resolver from the inner config.
  const BaseComp = styledDef.component as unknown as (
    props: Record<string, unknown>,
  ) => JSX.Element;

  function StyledComponent(
    props: StyledComponentProps<BaseComponent, V>,
  ): JSX.Element {
    // splitProps preserves Solid reactivity on each subset.
    const [variantPropsObj, rest] = splitProps(
      props,
      variantNames as (keyof typeof props)[],
    );
    const [styleProps, forwardProps] = splitProps(
      rest as {
        styles?: StyledSlotStyles<
          ExtractSlotStyleMap<BaseComponent>,
          ExtractStateKeys<BaseComponent>
        >;
      },
      ["styles"],
    );

    const styleResolver = createMemo(() => {
      // String-coerce variant values inside the memo so reactivity is tracked
      // per-variant. Booleans/numbers are dropped — variants are string-only
      // at runtime (see processStyledProps in @opentui-ui/styles).
      const variantValues: Partial<Record<keyof V, string>> = {};
      for (const name of variantNames) {
        const raw = variantPropsObj[name as keyof typeof variantPropsObj];
        if (typeof raw === "string") {
          variantValues[name as keyof V] = raw;
        }
      }
      return createStyleResolver(
        styledDef.processed,
        variantValues,
        styleProps.styles,
      );
    });

    const merged = mergeProps(forwardProps, {
      get styleResolver() {
        return styleResolver();
      },
    });

    return BaseComp(merged as Record<string, unknown>);
  }

  const Result = StyledComponent as StyledSolidComponent<BaseComponent, V>;
  Result[$$OtuiComponentMeta] = styledDef[$$OtuiComponentMeta];
  Result[$$StyledComponent] = true;
  Result[$$StyledConfig] = styledDef.processed;
  Result[$$StyledBase] =
    styledDef.component as unknown as ResolveStyledBase<BaseComponent>;

  return Result;
}
