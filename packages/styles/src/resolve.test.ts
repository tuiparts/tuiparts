import { describe, expect, it } from "bun:test";
import { processRecipeConfiguration, resolveRecipeStyles } from "./resolve";
import type {
  RecipeConfiguration,
  RecipeVariants,
  SlotStyleSet,
} from "./types";

// =============================================================================
// Test Fixture
// =============================================================================
//
// A synthetic component that mirrors Checkbox's shape: two slots, three state
// keys. Used purely as a substrate for testing the styles engine — no actual
// component or renderable involved.

type TestSlotStyleMap = {
  box: { color?: string; backgroundColor?: string; gap?: number };
  label: { color?: string; fontWeight?: "normal" | "bold" };
};

const TEST_STATE_KEYS = ["checked", "focused", "disabled"] as const;
type TestStateKeys = typeof TEST_STATE_KEYS;

// Generic in V so each call infers its own variant shape from the config
// literal. (CompoundVariant's mapped-key shape collapses badly when V = any.)
function resolve<V extends RecipeVariants<TestSlotStyleMap, TestStateKeys>>(
  config: RecipeConfiguration<TestSlotStyleMap, TestStateKeys, V>,
  state: Partial<Record<TestStateKeys[number], boolean>> = {},
  variantProps: Record<string, string> = {},
  inlineStyles?: SlotStyleSet<TestSlotStyleMap, TestStateKeys>,
) {
  const processed = processRecipeConfiguration(config, TEST_STATE_KEYS);
  return resolveRecipeStyles(
    processed,
    state,
    variantProps as Partial<Record<keyof V, string>>,
    inlineStyles,
  );
}

// =============================================================================
// processRecipeConfiguration
// =============================================================================

describe("processRecipeConfiguration", () => {
  it("populates defaults for missing fields", () => {
    const processed = processRecipeConfiguration({}, TEST_STATE_KEYS);
    expect(processed.base).toEqual({});
    expect(processed.variants).toEqual({});
    expect(processed.compoundVariants).toEqual([]);
    expect(processed.defaultVariants).toEqual({});
    expect(processed.stateKeys).toBe(TEST_STATE_KEYS);
  });

  it("pre-computes variantNameSet for O(1) lookup", () => {
    const processed = processRecipeConfiguration(
      {
        variants: {
          intent: { primary: { box: {} }, danger: { box: {} } },
          size: { sm: { box: {} }, lg: { box: {} } },
        },
      },
      TEST_STATE_KEYS,
    );
    expect(processed.variantNameSet).toBeInstanceOf(Set);
    expect(processed.variantNameSet.has("intent")).toBe(true);
    expect(processed.variantNameSet.has("size")).toBe(true);
    expect(processed.variantNameSet.has("nope")).toBe(false);
  });
});

// =============================================================================
// resolveRecipeStyles — base layer
// =============================================================================

describe("resolveRecipeStyles: base layer", () => {
  it("returns empty result for empty config", () => {
    expect(resolve({})).toEqual({});
  });

  it("applies base styles to slots", () => {
    const result = resolve({
      base: {
        box: { color: "white", backgroundColor: "black" },
        label: { color: "gray" },
      },
    });
    expect(result).toEqual({
      box: { color: "white", backgroundColor: "black" },
      label: { color: "gray" },
    });
  });

  it("applies base state selectors when matching state is active", () => {
    const result = resolve(
      {
        base: {
          box: { color: "white", _checked: { color: "green" } },
        },
      },
      { checked: true },
    );
    expect(result.box).toEqual({ color: "green" });
  });

  it("does not apply base state selectors when state is inactive", () => {
    const result = resolve(
      {
        base: {
          box: { color: "white", _checked: { color: "green" } },
        },
      },
      { checked: false },
    );
    expect(result.box).toEqual({ color: "white" });
  });

  it("applies state selectors in stateKeys order — later keys win", () => {
    // stateKeys order: ["checked", "focused", "disabled"]
    const result = resolve(
      {
        base: {
          box: {
            color: "white",
            _checked: { color: "green" },
            _focused: { color: "blue" },
          },
        },
      },
      { checked: true, focused: true },
    );
    expect(result.box).toEqual({ color: "blue" });
  });

  it("merges state selector props with non-selector props", () => {
    const result = resolve(
      {
        base: {
          box: {
            color: "white",
            backgroundColor: "black",
            _checked: { color: "green" }, // only overrides color, not backgroundColor
          },
        },
      },
      { checked: true },
    );
    expect(result.box).toEqual({ color: "green", backgroundColor: "black" });
  });
});

// =============================================================================
// resolveRecipeStyles — variant layer
// =============================================================================

describe("resolveRecipeStyles: variant layer", () => {
  it("applies variant styles when prop matches", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
        variants: {
          intent: {
            danger: { box: { color: "red" } },
          },
        },
      },
      {},
      { intent: "danger" },
    );
    expect(result.box).toEqual({ color: "red" });
  });

  it("variant overrides base", () => {
    const result = resolve(
      {
        base: { box: { color: "white", backgroundColor: "black" } },
        variants: {
          intent: {
            danger: { box: { color: "red" } },
          },
        },
      },
      {},
      { intent: "danger" },
    );
    expect(result.box).toEqual({ color: "red", backgroundColor: "black" });
  });

  it("ignores variant prop with no matching value", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
        variants: {
          intent: { danger: { box: { color: "red" } } },
        },
      },
      {},
      { intent: "nonexistent" },
    );
    expect(result.box).toEqual({ color: "white" });
  });

  it("applies defaultVariants when prop missing", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
        variants: {
          intent: {
            primary: { box: { color: "blue" } },
            danger: { box: { color: "red" } },
          },
        },
        defaultVariants: { intent: "primary" },
      },
      {},
      {}, // no intent prop
    );
    expect(result.box).toEqual({ color: "blue" });
  });

  it("explicit prop overrides defaultVariant", () => {
    const result = resolve(
      {
        variants: {
          intent: {
            primary: { box: { color: "blue" } },
            danger: { box: { color: "red" } },
          },
        },
        defaultVariants: { intent: "primary" },
      },
      {},
      { intent: "danger" },
    );
    expect(result.box).toEqual({ color: "red" });
  });

  it("variant state selectors override base state selectors", () => {
    const result = resolve(
      {
        base: { box: { _checked: { color: "green" } } },
        variants: {
          intent: {
            danger: { box: { _checked: { color: "red" } } },
          },
        },
      },
      { checked: true },
      { intent: "danger" },
    );
    expect(result.box).toEqual({ color: "red" });
  });

  it("multiple variants compose", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } } },
          size: { lg: { box: { gap: 2 } } },
        },
      },
      {},
      { intent: "danger", size: "lg" },
    );
    expect(result.box).toEqual({ color: "red", gap: 2 });
  });
});

// =============================================================================
// resolveRecipeStyles — compound variants
// =============================================================================

describe("resolveRecipeStyles: compound variants", () => {
  it("applies when all conditions match", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } } },
          size: { lg: { box: { gap: 2 } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            size: "lg",
            styles: { box: { backgroundColor: "darkred" } },
          },
        ],
      },
      {},
      { intent: "danger", size: "lg" },
    );
    expect(result.box).toEqual({
      color: "red",
      gap: 2,
      backgroundColor: "darkred",
    });
  });

  it("does not apply when any condition fails", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } }, primary: { box: {} } },
          size: { lg: { box: { gap: 2 } }, sm: { box: {} } },
        },
        compoundVariants: [
          {
            intent: "danger",
            size: "lg",
            styles: { box: { backgroundColor: "darkred" } },
          },
        ],
      },
      {},
      { intent: "danger", size: "sm" },
    );
    expect(result.box?.backgroundColor).toBeUndefined();
  });

  it("does not apply when there are no conditions, only styles", () => {
    // CompoundVariant<V,...> requires at least one variant key be present per
    // its mapped type; this test exercises the "0 conditions" runtime path
    // (`hasConditions=false`). Cast through to bypass the type-level guard.
    const result = resolve({
      compoundVariants: [
        // biome-ignore lint/suspicious/noExplicitAny: deliberately bypassing the type-level shape to test runtime guard
        { styles: { box: { backgroundColor: "purple" } } } as any,
      ],
    });
    expect(result.box?.backgroundColor).toBeUndefined();
  });

  it("compound variant overrides regular variant", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } } },
          size: { lg: { box: { color: "redLG" } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            size: "lg",
            styles: { box: { color: "compoundColor" } },
          },
        ],
      },
      {},
      { intent: "danger", size: "lg" },
    );
    expect(result.box).toEqual({ color: "compoundColor" });
  });

  it("applies state selectors from compound variant", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            styles: {
              box: { _focused: { color: "focusedDanger" } },
            },
          },
        ],
      },
      { focused: true },
      { intent: "danger" },
    );
    expect(result.box).toEqual({ color: "focusedDanger" });
  });

  it("compound matches against defaultVariants too", () => {
    const result = resolve(
      {
        variants: {
          intent: { danger: { box: { color: "red" } } },
        },
        defaultVariants: { intent: "danger" },
        compoundVariants: [
          {
            intent: "danger",
            styles: { box: { backgroundColor: "darkred" } },
          },
        ],
      },
      {},
      {}, // no explicit intent
    );
    expect(result.box).toEqual({
      color: "red",
      backgroundColor: "darkred",
    });
  });
});

// =============================================================================
// resolveRecipeStyles — inline styles
// =============================================================================

describe("resolveRecipeStyles: inline styles", () => {
  it("inline overrides everything", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
        variants: {
          intent: { danger: { box: { color: "red" } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            styles: { box: { color: "compoundRed" } },
          },
        ],
      },
      {},
      { intent: "danger" },
      { box: { color: "inlineColor" } },
    );
    expect(result.box).toEqual({ color: "inlineColor" });
  });

  it("inline can introduce new properties", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
      },
      {},
      {},
      { box: { backgroundColor: "blue" } },
    );
    expect(result.box).toEqual({ color: "white", backgroundColor: "blue" });
  });

  it("inline state selectors apply", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
      },
      { focused: true },
      {},
      { box: { _focused: { color: "inlineFocus" } } },
    );
    expect(result.box).toEqual({ color: "inlineFocus" });
  });
});

// =============================================================================
// resolveRecipeStyles — full precedence sweep
// =============================================================================

describe("resolveRecipeStyles: layer precedence", () => {
  it("later layers win across base → variant → compound → inline", () => {
    const result = resolve(
      {
        base: { box: { color: "fromBase" } },
        variants: {
          intent: { danger: { box: { color: "fromVariant" } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            styles: { box: { color: "fromCompound" } },
          },
        ],
      },
      {},
      { intent: "danger" },
      { box: { color: "fromInline" } },
    );
    expect(result.box).toEqual({ color: "fromInline" });
  });

  it("each layer can contribute non-overlapping properties", () => {
    const result = resolve(
      {
        base: { box: { color: "white" } },
        variants: {
          intent: { danger: { box: { backgroundColor: "red" } } },
        },
        compoundVariants: [
          {
            intent: "danger",
            styles: { box: { gap: 2 } },
          },
        ],
      },
      {},
      { intent: "danger" },
      { label: { fontWeight: "bold" } },
    );
    expect(result).toEqual({
      box: { color: "white", backgroundColor: "red", gap: 2 },
      label: { fontWeight: "bold" },
    });
  });
});
