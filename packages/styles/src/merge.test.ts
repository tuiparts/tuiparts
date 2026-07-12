import { describe, expect, it } from "bun:test";
import { mergeSlotStyles, mergeStyle, mergeStyledConfig } from "./merge";
import type { StyledConfig, VariantsConfig } from "./types";

type TestSlotStyleMap = {
  box: { color?: string; backgroundColor?: string; gap?: number };
  label: { color?: string; fontWeight?: "normal" | "bold" };
};
type TestStateKeys = readonly ["checked", "focused", "disabled"];
type TestVariants = VariantsConfig<TestSlotStyleMap, TestStateKeys>;
type TestConfig = StyledConfig<TestSlotStyleMap, TestStateKeys, TestVariants>;

// =============================================================================
// mergeStyle
// =============================================================================

describe("mergeStyle", () => {
  it("override wins for shared keys", () => {
    expect(mergeStyle({ color: "white", gap: 1 }, { color: "green" })).toEqual({
      color: "green",
      gap: 1,
    });
  });

  it("override skips undefined values (preserves base)", () => {
    type S = { color?: string; gap?: number; backgroundColor?: string };
    expect(
      mergeStyle<S>(
        { color: "white", gap: 1 },
        { color: undefined, backgroundColor: "blue" },
      ),
    ).toEqual({ color: "white", gap: 1, backgroundColor: "blue" });
  });

  it("returns a new object — does not mutate base", () => {
    const base = { color: "white" };
    const result = mergeStyle(base, { color: "green" });
    expect(base.color).toBe("white");
    expect(result).not.toBe(base);
  });
});

// =============================================================================
// mergeSlotStyles
// =============================================================================

describe("mergeSlotStyles", () => {
  it("merges per-slot — override property wins", () => {
    const result = mergeSlotStyles<TestSlotStyleMap, TestStateKeys>(
      { box: { color: "white" }, label: { color: "gray" } },
      { box: { color: "green" } },
    );
    expect(result).toEqual({
      box: { color: "green" },
      label: { color: "gray" },
    });
  });

  it("adds new slots from override", () => {
    const result = mergeSlotStyles<TestSlotStyleMap, TestStateKeys>(
      { box: { color: "white" } },
      { label: { color: "gray" } },
    );
    expect(result).toEqual({
      box: { color: "white" },
      label: { color: "gray" },
    });
  });

  it("skips undefined slot values in override", () => {
    const result = mergeSlotStyles<TestSlotStyleMap, TestStateKeys>(
      { box: { color: "white" } },
      { box: undefined, label: { color: "gray" } },
    );
    expect(result).toEqual({
      box: { color: "white" },
      label: { color: "gray" },
    });
  });

  it("merges state selectors within a slot (override wins per prop)", () => {
    const result = mergeSlotStyles<TestSlotStyleMap, TestStateKeys>(
      {
        box: {
          color: "white",
          _checked: { color: "green", backgroundColor: "darkgreen" },
        },
      },
      {
        box: {
          _checked: { color: "blue" }, // overrides color, keeps backgroundColor
        },
      },
    );
    expect(result.box).toEqual({
      color: "white",
      _checked: { color: "blue", backgroundColor: "darkgreen" },
    });
  });

  it("adds new state selectors from override", () => {
    const result = mergeSlotStyles<TestSlotStyleMap, TestStateKeys>(
      { box: { _checked: { color: "green" } } },
      { box: { _focused: { color: "blue" } } },
    );
    expect(result.box).toEqual({
      _checked: { color: "green" },
      _focused: { color: "blue" },
    });
  });
});

// =============================================================================
// mergeStyledConfig
// =============================================================================

describe("mergeStyledConfig", () => {
  it("deep-merges base styles", () => {
    const base: TestConfig = {
      base: { box: { color: "white", gap: 1 } },
    };
    const override: TestConfig = {
      base: { box: { color: "green" } },
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.base).toEqual({ box: { color: "green", gap: 1 } });
  });

  it("merges variants by name (existing variant extended with new values)", () => {
    const base: TestConfig = {
      variants: {
        intent: { primary: { box: { color: "blue" } } },
      },
    };
    const override: TestConfig = {
      variants: {
        intent: { danger: { box: { color: "red" } } },
      },
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.variants?.intent).toEqual({
      primary: { box: { color: "blue" } },
      danger: { box: { color: "red" } },
    });
  });

  it("merges variants — same value extends slot styles", () => {
    const base: TestConfig = {
      variants: {
        intent: { primary: { box: { color: "blue" } } },
      },
    };
    const override: TestConfig = {
      variants: {
        intent: { primary: { box: { backgroundColor: "darkblue" } } },
      },
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.variants?.intent?.primary?.box).toEqual({
      color: "blue",
      backgroundColor: "darkblue",
    });
  });

  it("adds new variant names from override", () => {
    const base: TestConfig = {
      variants: { intent: { primary: { box: {} } } },
    };
    const override: TestConfig = {
      variants: { size: { lg: { box: { gap: 2 } } } },
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.variants?.intent).toBeDefined();
    expect(merged.variants?.size?.lg?.box?.gap).toBe(2);
  });

  it("appends compoundVariants in order (base then override)", () => {
    // Inline literals (no explicit TestConfig type) so TS infers a narrow V
    // — otherwise CompoundVariant collapses to a shape that conflicts with
    // its `styles` key.
    const base = {
      variants: {
        intent: { primary: { box: {} } as TestSlotStyleMap },
      },
      compoundVariants: [
        { intent: "primary" as const, styles: { box: { color: "first" } } },
      ],
    };
    const override = {
      variants: {
        intent: { primary: { box: {} } as TestSlotStyleMap },
      },
      compoundVariants: [
        { intent: "primary" as const, styles: { box: { color: "second" } } },
      ],
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.compoundVariants).toHaveLength(2);
    expect(merged.compoundVariants?.[0]?.styles?.box?.color).toBe("first");
    expect(merged.compoundVariants?.[1]?.styles?.box?.color).toBe("second");
  });

  it("shallow-merges defaultVariants — override wins", () => {
    const base: TestConfig = {
      defaultVariants: { intent: "primary" },
    };
    const override: TestConfig = {
      defaultVariants: { intent: "danger", size: "lg" },
    };
    const merged = mergeStyledConfig(base, override);
    expect(merged.defaultVariants).toEqual({
      intent: "danger",
      size: "lg",
    });
  });

  it("handles empty configs", () => {
    const merged = mergeStyledConfig<
      TestSlotStyleMap,
      TestStateKeys,
      TestVariants,
      TestVariants
    >({}, {});
    expect(merged.base).toEqual({});
    expect(merged.variants).toEqual({});
    expect(merged.compoundVariants).toEqual([]);
    expect(merged.defaultVariants).toEqual({});
  });

  it("preserves base when override has no value for a field", () => {
    const base: TestConfig = {
      base: { box: { color: "white" } },
      defaultVariants: { intent: "primary" },
    };
    const merged = mergeStyledConfig<
      TestSlotStyleMap,
      TestStateKeys,
      TestVariants,
      TestVariants
    >(base, {});
    expect(merged.base).toEqual({ box: { color: "white" } });
    expect(merged.defaultVariants).toEqual({ intent: "primary" });
  });
});
