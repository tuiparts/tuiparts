import { mergeRecipeConfiguration } from "./merge";
import { processRecipeConfiguration, resolveRecipeStyles } from "./resolve";
import type {
  CompoundVariant,
  DefaultVariants,
  ProcessedRecipeConfig,
  RecipeConfiguration,
  RecipeVariants,
  ResolvedStyleSlots,
  SlotStyleSet,
  VariantProps,
} from "./types";

const RECIPE_DEFINITION = Symbol.for("@opentui-ui/styles/recipe-definition");
const COMPONENT_PROPS = Symbol("@opentui-ui/styles/component-props");

export type SlotStyles<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> = SlotStyleSet<SlotStyleMap, StateKeys>;

export type ResolvedRecipeStyles<SlotStyleMap extends Record<string, object>> =
  ResolvedStyleSlots<SlotStyleMap>;

export interface RecipeContract<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
> {
  /** Recipe-local style slots. These are not primitive composition parts. */
  readonly slots: SlotStyleMap;
  /** Ordered state keys accepted by underscore-prefixed selectors. */
  readonly stateKeys: StateKeys;
  /** Type-only carrier used to reject collisions with component props. */
  readonly [COMPONENT_PROPS]?: ComponentProps;
}

type NonCollidingVariants<ComponentProps extends object, V> = {
  [Name in keyof V]: Name extends keyof ComponentProps | "styles"
    ? never
    : V[Name];
};

export type RecipeConfig<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> = Omit<RecipeConfiguration<SlotStyleMap, StateKeys, V>, "variants"> & {
  variants?: V & NonCollidingVariants<ComponentProps, V>;
};

type MergeVariants<A, B> = Omit<A, keyof B> & {
  [Name in keyof B]: Name extends keyof A ? A[Name] & B[Name] : B[Name];
};

type RecipeExtensionConfig<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  BaseVariants extends RecipeVariants<SlotStyleMap, StateKeys>,
  ExtensionVariants extends RecipeVariants<SlotStyleMap, StateKeys>,
  MergedVariants extends RecipeVariants<
    SlotStyleMap,
    StateKeys
  > = MergeVariants<BaseVariants, ExtensionVariants>,
> = {
  base?: SlotStyles<SlotStyleMap, StateKeys>;
  variants?: ExtensionVariants &
    NonCollidingVariants<ComponentProps, ExtensionVariants>;
  compoundVariants?: CompoundVariant<MergedVariants, SlotStyleMap, StateKeys>[];
  defaultVariants?: DefaultVariants<MergedVariants>;
};

export type RecipeInput<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> = VariantProps<V> & {
  styles?: SlotStyles<SlotStyleMap, StateKeys>;
};

export interface RecipeSplit<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> {
  recipeProps: RecipeInput<SlotStyleMap, StateKeys, V>;
  componentProps: ComponentProps;
}

export interface RecipeDefinition<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> {
  readonly contract: RecipeContract<ComponentProps, SlotStyleMap, StateKeys>;
  resolve(
    props: RecipeInput<SlotStyleMap, StateKeys, V>,
    state: Partial<Record<StateKeys[number], boolean>>,
  ): ResolvedRecipeStyles<SlotStyleMap>;
  splitProps<Props extends ComponentProps & Record<string, unknown>>(
    props: Props & RecipeInput<SlotStyleMap, StateKeys, V>,
  ): RecipeSplit<Omit<Props, keyof V | "styles">, SlotStyleMap, StateKeys, V>;
}

interface RecipeInternals<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
> {
  readonly config: RecipeConfiguration<SlotStyleMap, StateKeys, V>;
  readonly processed: ProcessedRecipeConfig<SlotStyleMap, StateKeys, V>;
}

function internalsOf<
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  recipe: RecipeDefinition<object, SlotStyleMap, StateKeys, V>,
): RecipeInternals<SlotStyleMap, StateKeys, V> {
  return (
    recipe as unknown as Record<
      typeof RECIPE_DEFINITION,
      RecipeInternals<SlotStyleMap, StateKeys, V>
    >
  )[RECIPE_DEFINITION];
}

export type RecipeProps<Recipe> =
  Recipe extends RecipeDefinition<
    object,
    infer SlotStyleMap,
    infer StateKeys,
    infer V
  >
    ? RecipeInput<SlotStyleMap, StateKeys, V>
    : never;

export function defineRecipeContract<ComponentProps extends object>(): <
  SlotStyleMap extends Record<string, object>,
  const StateKeys extends readonly string[],
>(contract: {
  slots: SlotStyleMap;
  stateKeys: StateKeys;
}) => RecipeContract<ComponentProps, SlotStyleMap, StateKeys> {
  return (contract) => contract;
}

function buildRecipe<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  contract: RecipeContract<ComponentProps, SlotStyleMap, StateKeys>,
  config: RecipeConfiguration<SlotStyleMap, StateKeys, V>,
): RecipeDefinition<ComponentProps, SlotStyleMap, StateKeys, V> {
  const processed = processRecipeConfiguration(config, contract.stateKeys);

  return Object.freeze({
    contract,
    [RECIPE_DEFINITION]: { config, processed },
    resolve(
      props: RecipeInput<SlotStyleMap, StateKeys, V>,
      state: Partial<Record<StateKeys[number], boolean>>,
    ) {
      const variants: Partial<Record<keyof V, string>> = {};
      for (const name of processed.variantNameSet) {
        const value = props[name as keyof typeof props];
        if (typeof value === "string") {
          variants[name as keyof V] = value;
        }
      }
      return resolveRecipeStyles(processed, state, variants, props.styles);
    },
    splitProps<Props extends ComponentProps & Record<string, unknown>>(
      props: Props & RecipeInput<SlotStyleMap, StateKeys, V>,
    ) {
      const recipeProps: Record<string, unknown> = {};
      const componentProps: Record<string, unknown> = {};

      for (const name in props) {
        if (!Object.hasOwn(props, name)) continue;
        if (name === "styles" || processed.variantNameSet.has(name)) {
          recipeProps[name] = props[name];
        } else {
          componentProps[name] = props[name];
        }
      }

      return { recipeProps, componentProps } as RecipeSplit<
        Omit<Props, keyof V | "styles">,
        SlotStyleMap,
        StateKeys,
        V
      >;
    },
  });
}

export function createRecipe<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  V extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  contract: RecipeContract<ComponentProps, SlotStyleMap, StateKeys>,
  config: RecipeConfig<ComponentProps, SlotStyleMap, StateKeys, V>,
): RecipeDefinition<ComponentProps, SlotStyleMap, StateKeys, V> {
  return buildRecipe(contract, config);
}

export function extendRecipe<
  ComponentProps extends object,
  SlotStyleMap extends Record<string, object>,
  StateKeys extends readonly string[],
  BaseVariants extends RecipeVariants<SlotStyleMap, StateKeys>,
  ExtensionVariants extends RecipeVariants<SlotStyleMap, StateKeys>,
>(
  recipe: RecipeDefinition<
    ComponentProps,
    SlotStyleMap,
    StateKeys,
    BaseVariants
  >,
  config: RecipeExtensionConfig<
    ComponentProps,
    SlotStyleMap,
    StateKeys,
    BaseVariants,
    ExtensionVariants
  >,
): RecipeDefinition<
  ComponentProps,
  SlotStyleMap,
  StateKeys,
  MergeVariants<BaseVariants, ExtensionVariants>
> {
  type MergedVariants = MergeVariants<BaseVariants, ExtensionVariants>;
  const merged = mergeRecipeConfiguration(
    internalsOf(recipe).config,
    config as RecipeConfiguration<SlotStyleMap, StateKeys, ExtensionVariants>,
  ) as RecipeConfiguration<SlotStyleMap, StateKeys, MergedVariants>;

  return buildRecipe(recipe.contract, merged);
}
