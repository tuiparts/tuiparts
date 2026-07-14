import { describe, expect, test } from "bun:test";
import {
  createRecipe,
  defineRecipeContract,
  extendRecipe,
  type RecipeProps,
} from "./recipe";

type BaseProps = {
  children?: unknown;
  disabled?: boolean;
  onPress?: () => void;
};

type Slots = {
  root: { color?: string; padding?: number };
  label: { color?: string; content?: string };
};

const contract = defineRecipeContract<BaseProps>()({
  slots: {} as Slots,
  stateKeys: ["disabled", "focused"] as const,
});

const baseRecipe = createRecipe(contract, {
  base: {
    root: {
      color: "white",
      padding: 1,
      _disabled: { color: "gray" },
    },
    label: { color: "white" },
  },
  variants: {
    tone: {
      neutral: { label: { color: "silver" } },
      danger: {
        label: {
          color: "red",
          _focused: { color: "bright-red" },
        },
      },
    },
    size: {
      compact: { root: { padding: 0 } },
      comfortable: { root: { padding: 2 } },
    },
  },
  compoundVariants: [
    {
      tone: "danger",
      size: "compact",
      styles: { root: { color: "dark-red" } },
    },
  ],
  defaultVariants: {
    tone: "neutral",
    size: "comfortable",
  },
});

describe("recipe styling", () => {
  test("resolves every layer and state selectors in deterministic order", () => {
    expect(
      baseRecipe.resolve(
        {
          tone: "danger",
          size: "compact",
          styles: {
            label: {
              color: "orange",
              _focused: { color: "yellow" },
            },
          },
        },
        { disabled: true, focused: true },
      ),
    ).toEqual({
      root: { color: "dark-red", padding: 0 },
      label: { color: "yellow" },
    });
  });

  test("separates recipe inputs from component props without shadow state", () => {
    const onPress = () => {};
    expect(
      baseRecipe.splitProps({
        children: "Save",
        disabled: true,
        onPress,
        tone: "danger",
        styles: { root: { padding: 3 } },
      }),
    ).toEqual({
      recipeProps: {
        tone: "danger",
        styles: { root: { padding: 3 } },
      },
      componentProps: {
        children: "Save",
        disabled: true,
        onPress,
      },
    });
  });

  test("composition retains inherited variants and extends their values", () => {
    const composed = extendRecipe(baseRecipe, {
      variants: {
        tone: {
          warning: { label: { color: "yellow" } },
        },
        emphasis: {
          low: { root: { color: "gray" } },
          high: { root: { color: "white" } },
        },
      },
      compoundVariants: [
        {
          tone: "danger",
          emphasis: "high",
          styles: { root: { color: "bright-red" } },
        },
      ],
    });

    const inherited: RecipeProps<typeof composed> = {
      tone: "neutral",
      size: "compact",
      emphasis: "high",
    };
    const extended: RecipeProps<typeof composed> = {
      tone: "warning",
      emphasis: "low",
    };
    const invalid: RecipeProps<typeof composed> = {
      // @ts-expect-error composed tone values remain a closed union
      tone: "missing",
    };
    void invalid;

    expect(composed.resolve(inherited, {})).toEqual({
      root: { color: "white", padding: 0 },
      label: { color: "silver" },
    });
    expect(composed.resolve(extended, {})).toEqual({
      root: { color: "gray", padding: 2 },
      label: { color: "yellow" },
    });
  });
});

// Recipe variants may not consume props that belong to component behavior,
// content, or events.
createRecipe(contract, {
  variants: {
    // @ts-expect-error "disabled" belongs to BaseProps
    disabled: {
      true: { root: { color: "gray" } },
    },
  },
});
