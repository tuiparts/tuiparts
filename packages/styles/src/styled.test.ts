import { describe, expect, it } from "bun:test";
import { processStyledConfig } from "./resolve";
import {
  type ComponentWithMeta,
  createStyled,
  getVariantNames,
  isStyledComponentDefinition,
  processStyledProps,
  splitVariantProps,
} from "./styled";
import {
  $$OtuiComponentMeta,
  $$StyledBase,
  $$StyledComponent,
  $$StyledConfig,
} from "./symbols";
import { hasComponentMeta } from "./types";

// =============================================================================
// Test Fixture
// =============================================================================

type TestSlotStyleMap = {
  box: { color?: string; backgroundColor?: string };
  label: { color?: string };
};
const TEST_SLOTS = ["box", "label"] as const;
const TEST_STATE_KEYS = ["checked", "focused", "disabled"] as const;
type TestSlots = typeof TEST_SLOTS;
type TestStateKeys = typeof TEST_STATE_KEYS;

const TEST_META = {
  tag: "otui-test",
  slots: TEST_SLOTS,
  slotStyleMap: {} as TestSlotStyleMap,
  stateKeys: TEST_STATE_KEYS,
} as const;

function makeComponent(): ComponentWithMeta<
  TestSlots,
  TestSlotStyleMap,
  TestStateKeys
> {
  const fn = (() => null) as unknown as ComponentWithMeta<
    TestSlots,
    TestSlotStyleMap,
    TestStateKeys
  >;
  (fn as { [$$OtuiComponentMeta]: typeof TEST_META })[$$OtuiComponentMeta] =
    TEST_META;
  return fn;
}

// =============================================================================
// createStyled
// =============================================================================

describe("createStyled", () => {
  it("throws if component lacks $$OtuiComponentMeta", () => {
    expect(() =>
      createStyled(
        // biome-ignore lint/suspicious/noExplicitAny: testing missing-meta path
        (() => null) as any,
        {},
      ),
    ).toThrow(/OTUI metadata/);
  });

  it("returns a definition that carries through processed config + meta", () => {
    const Component = makeComponent();
    const def = createStyled(Component, {
      base: { box: { color: "white" } },
      variants: {
        intent: { danger: { box: { color: "red" } } },
      },
      defaultVariants: { intent: "danger" },
    });

    expect(def.component).toBe(Component);
    expect(def[$$StyledBase]).toBe(Component);
    expect(def[$$StyledComponent]).toBe(true);
    expect(def[$$StyledConfig]).toBe(def.processed);
    expect(def[$$OtuiComponentMeta]).toBe(TEST_META);
    expect(def.processed.base).toEqual({ box: { color: "white" } });
    expect(def.processed.defaultVariants).toEqual({ intent: "danger" });
    expect(def.processed.variantNameSet.has("intent")).toBe(true);
  });

  it("composes styled definitions — styled(styled(C)) merges configs", () => {
    const Component = makeComponent();

    const base = createStyled(Component, {
      base: { box: { color: "white" } },
      variants: { intent: { primary: { box: { color: "blue" } } } },
      defaultVariants: { intent: "primary" },
    });

    const extended = createStyled(base, {
      variants: { intent: { danger: { box: { color: "red" } } } },
      defaultVariants: { intent: "danger" },
    });

    // Variants merged by name — both primary and danger present.
    // (Cast through unknown because mergeVariants's intersection-typed return
    // is not narrow enough for TS to keep the `primary` key visible.)
    const intent = extended.processed.variants.intent as unknown as Record<
      string,
      unknown
    >;
    expect(intent.primary).toBeDefined();
    expect(intent.danger).toBeDefined();
    // Override wins for defaultVariants
    expect(extended.processed.defaultVariants).toEqual({ intent: "danger" });
    // Base styles preserved
    expect(extended.processed.base.box?.color).toBe("white");
  });

  it("flattens composition to the deepest base — `component` and `[$$StyledBase]` skip intermediate styled wrappers", () => {
    // Regression: the old contract pointed `extended.component` at the inner
    // styled definition, which forced framework wrappers to call back through
    // the inner wrapper at render time and silently lose the outer resolver.
    // The new contract is that `.component` is always the original
    // `ComponentWithMeta` so a single render call against it carries the
    // merged config.
    const Component = makeComponent();
    const base = createStyled(Component, {
      base: { box: { color: "white" } },
    });
    const extended = createStyled(base, {
      base: { box: { backgroundColor: "black" } },
    });
    expect(extended.component).toBe(Component);
    expect(extended[$$StyledBase]).toBe(Component);
    expect(extended[$$OtuiComponentMeta]).toBe(TEST_META);
    // Configs accumulated through both layers
    expect(extended.processed.base.box?.color).toBe("white");
    expect(extended.processed.base.box?.backgroundColor).toBe("black");
  });

  it("treats a framework-shaped component (carrying $$StyledBase + markers) as composable", () => {
    // The framework wrappers (react/solid `styled()`) attach
    // $$StyledComponent + $$StyledConfig + $$StyledBase + $$OtuiComponentMeta
    // to their returned function components. createStyled must treat those
    // the same as a framework-agnostic StyledComponentDefinition.
    const Component = makeComponent();
    const innerProcessed = processStyledConfig(
      { base: { box: { color: "white" } } },
      TEST_STATE_KEYS,
    );
    const fakeFrameworkWrapper: ComponentWithMeta<
      TestSlots,
      TestSlotStyleMap,
      TestStateKeys
    > & {
      [$$StyledComponent]: true;
      [$$StyledConfig]: typeof innerProcessed;
      [$$StyledBase]: ComponentWithMeta<
        TestSlots,
        TestSlotStyleMap,
        TestStateKeys
      >;
    } = Object.assign((() => null) as never, {
      [$$OtuiComponentMeta]: TEST_META,
      [$$StyledComponent]: true as const,
      [$$StyledConfig]: innerProcessed,
      [$$StyledBase]: Component,
    });

    expect(isStyledComponentDefinition(fakeFrameworkWrapper)).toBe(true);

    const extended = createStyled(fakeFrameworkWrapper, {
      base: { box: { backgroundColor: "black" } },
    });
    expect(extended.component).toBe(Component);
    expect(extended[$$StyledBase]).toBe(Component);
    expect(extended.processed.base.box?.color).toBe("white");
    expect(extended.processed.base.box?.backgroundColor).toBe("black");
  });
});

// =============================================================================
// isStyledComponentDefinition
// =============================================================================

describe("isStyledComponentDefinition", () => {
  it("returns true for styled definitions", () => {
    const Component = makeComponent();
    const def = createStyled(Component, {});
    expect(isStyledComponentDefinition(def)).toBe(true);
  });

  it("returns false for plain components", () => {
    const Component = makeComponent();
    expect(isStyledComponentDefinition(Component)).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isStyledComponentDefinition(null)).toBe(false);
    expect(isStyledComponentDefinition(undefined)).toBe(false);
    expect(isStyledComponentDefinition("string")).toBe(false);
    expect(isStyledComponentDefinition(42)).toBe(false);
  });
});

// =============================================================================
// hasComponentMeta
// =============================================================================

describe("hasComponentMeta", () => {
  it("returns true for function components with meta attached", () => {
    // Regression: components in this repo are Object.assign(function, { meta }),
    // i.e. typeof === "function". The guard must accept that shape.
    const fn: unknown = makeComponent();
    expect(hasComponentMeta(fn)).toBe(true);
  });

  it("returns true for object values with meta attached", () => {
    const obj: unknown = { [$$OtuiComponentMeta]: TEST_META };
    expect(hasComponentMeta(obj)).toBe(true);
  });

  it("returns false for plain functions", () => {
    expect(hasComponentMeta(() => null)).toBe(false);
  });

  it("returns false for nullish and primitive values", () => {
    expect(hasComponentMeta(null)).toBe(false);
    expect(hasComponentMeta(undefined)).toBe(false);
    expect(hasComponentMeta("string")).toBe(false);
    expect(hasComponentMeta(42)).toBe(false);
  });
});

// =============================================================================
// splitVariantProps
// =============================================================================

describe("splitVariantProps", () => {
  it("separates variant props from forward props", () => {
    const variantNameSet = new Set(["intent", "size"]);
    const [variantProps, forwardProps] = splitVariantProps(
      {
        intent: "danger",
        size: "lg",
        label: "Hello",
        onClick: () => {},
      },
      variantNameSet,
    );
    expect(variantProps).toEqual({ intent: "danger", size: "lg" });
    expect(forwardProps).toHaveProperty("label", "Hello");
    expect(forwardProps).toHaveProperty("onClick");
    expect(forwardProps).not.toHaveProperty("intent");
    expect(forwardProps).not.toHaveProperty("size");
  });

  it("forwards everything when variant set is empty", () => {
    const [variantProps, forwardProps] = splitVariantProps(
      { label: "Hello", checked: true },
      new Set(),
    );
    expect(variantProps).toEqual({});
    expect(forwardProps).toEqual({ label: "Hello", checked: true });
  });

  it("returns empty bags when input is empty", () => {
    const [variantProps, forwardProps] = splitVariantProps(
      {},
      new Set(["intent"]),
    );
    expect(variantProps).toEqual({});
    expect(forwardProps).toEqual({});
  });

  it("splits by key only — does not filter undefined or non-string values", () => {
    // Documents the contract: callers (e.g. the framework adapters) are
    // responsible for filtering value types. splitVariantProps is purely a
    // key-based split.
    const variantNameSet = new Set(["intent", "size"]);
    const [variantProps, forwardProps] = splitVariantProps(
      { intent: undefined, size: 42, label: "Hello" },
      variantNameSet,
    );
    expect(variantProps).toEqual({ intent: undefined, size: 42 });
    expect(forwardProps).toEqual({ label: "Hello" });
  });
});

// =============================================================================
// getVariantNames
// =============================================================================

// =============================================================================
// processStyledProps
// =============================================================================

describe("processStyledProps", () => {
  const processed = processStyledConfig(
    {
      variants: {
        intent: { primary: { box: {} }, danger: { box: {} } },
        size: { sm: { box: {} }, lg: { box: {} } },
      },
    },
    TEST_STATE_KEYS,
  );
  const variantNames = ["intent", "size"] as const;

  it("strips variant props and `styles` out of forwardProps", () => {
    const result = processStyledProps(
      {
        intent: "danger",
        size: "lg",
        label: "Hello",
        checked: true,
        styles: { box: { color: "red" } },
      },
      processed,
      variantNames,
    );
    expect(result.forwardProps).toEqual({ label: "Hello", checked: true });
    expect(result.forwardProps).not.toHaveProperty("styles");
    expect(result.forwardProps).not.toHaveProperty("intent");
    expect(result.forwardProps).not.toHaveProperty("size");
  });

  it("captures inline styles separately", () => {
    const styles = { box: { color: "red" } };
    const result = processStyledProps({ styles }, processed, variantNames);
    expect(result.inlineStyles).toBe(styles);
  });

  it("filters non-string variant values out of variantValues but preserves them in deps order", () => {
    const result = processStyledProps(
      // boolean and number variant values are not matchable at runtime
      // (resolveStyles keys variant tables by string). They get dropped.
      {
        intent: "danger",
        size: 42 as unknown as string,
      },
      processed,
      variantNames,
    );
    expect(result.variantValues).toEqual({ intent: "danger" });
    expect(result.variantDeps).toEqual(["danger", undefined]);
  });

  it("returns empty bags when no styled props are present", () => {
    const result = processStyledProps({}, processed, variantNames);
    expect(result.forwardProps).toEqual({});
    expect(result.variantValues).toEqual({});
    expect(result.inlineStyles).toBeUndefined();
    expect(result.variantDeps).toEqual([undefined, undefined]);
  });
});

describe("getVariantNames", () => {
  it("returns variant names from processed config", () => {
    const processed = processStyledConfig(
      {
        variants: {
          intent: { primary: { box: {} } },
          size: { lg: { box: {} } },
        },
      },
      TEST_STATE_KEYS,
    );
    const names = getVariantNames(processed);
    expect(names).toContain("intent");
    expect(names).toContain("size");
    expect(names).toHaveLength(2);
  });

  it("returns empty array when no variants", () => {
    const processed = processStyledConfig({}, TEST_STATE_KEYS);
    expect(getVariantNames(processed)).toEqual([]);
  });
});
