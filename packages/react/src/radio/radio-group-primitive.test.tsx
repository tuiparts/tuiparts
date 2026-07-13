import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  RadioGroupItemRenderable,
  RadioGroupItemState,
  RadioGroupRootRenderable,
} from "@opentui-ui/core/radio";
import { act, createElement, createRef, type ReactNode, useState } from "react";
import { RadioGroup } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React RadioGroup", () => {
  it("composes parts and publishes Item-owned focus while navigating", async () => {
    const renderState = (state: RadioGroupItemState) =>
      createElement("text", {
        id: "alpha-state",
        content: `${state.selected}:${state.focused}:${state.tabbable}`,
      });
    setup = await testRender(
      createElement(
        RadioGroup.Root,
        { id: "root", defaultValue: "alpha", flexDirection: "column" },
        createElement(
          RadioGroup.Item,
          { id: "alpha", value: "alpha", height: 1 },
          renderState as unknown as ReactNode,
        ),
        createElement(
          RadioGroup.Item,
          { id: "beta", value: "beta", height: 1 },
          createElement(
            RadioGroup.Indicator,
            { id: "beta-indicator", keepMounted: true },
            createElement("text", { content: "x" }),
          ),
        ),
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as RadioGroupRootRenderable;
    const alpha = setup.renderer.root.findDescendantById(
      "alpha",
    ) as RadioGroupItemRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioGroupItemRenderable;
    expect(
      setup.renderer.root.findDescendantById("beta-indicator"),
    ).toMatchObject({ visible: false });

    await act(async () => alpha.focus());
    await act(async () => setup?.mockInput.pressArrow("down"));
    await setup.waitFor(() => root.value === "beta" && beta.focused);

    expect(alpha.store.getItemState(alpha.key)).not.toHaveProperty("focused");
    expect(beta.getState()).toMatchObject({ focused: true, selected: true });
    expect(
      setup.renderer.root.findDescendantById("beta-indicator"),
    ).toBeDefined();
  });

  it("updates controlled props without replacing Root or Item", async () => {
    const rootRef = createRef<RadioGroupRootRenderable>();
    const itemRef = createRef<RadioGroupItemRenderable>();
    let rename: (() => void) | undefined;
    function App() {
      const [value, setValue] = useState<string | null>("alpha");
      const [itemValue, setItemValue] = useState("alpha");
      rename = () => setItemValue("renamed");
      return createElement(
        RadioGroup.Root,
        { value, onValueChange: setValue, ref: rootRef },
        createElement(RadioGroup.Item, {
          id: "retained",
          value: itemValue,
          ref: itemRef,
        }),
        createElement(RadioGroup.Item, { id: "beta", value: "beta" }),
      );
    }
    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = rootRef.current;
    const item = itemRef.current;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioGroupItemRenderable;

    await act(async () => beta.press());
    await setup.waitFor(() => rootRef.current?.value === "beta");
    await act(async () => rename?.());
    await setup.waitFor(() => itemRef.current?.value === "renamed");

    expect(rootRef.current).toBe(root);
    expect(itemRef.current).toBe(item);
  });

  it("removes focused dynamic Items without stale registration", async () => {
    const rootRef = createRef<RadioGroupRootRenderable>();
    const fallbackRef = createRef<RadioGroupItemRenderable>();
    const dynamicRef = createRef<RadioGroupItemRenderable>();
    let show: ((visible: boolean) => void) | undefined;
    function App() {
      const [visible, setVisible] = useState(true);
      show = setVisible;
      return createElement(
        RadioGroup.Root,
        { ref: rootRef },
        createElement(RadioGroup.Item, {
          value: "fallback",
          ref: fallbackRef,
        }),
        visible
          ? createElement(RadioGroup.Item, {
              value: "dynamic",
              ref: dynamicRef,
            })
          : null,
      );
    }
    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const key = dynamicRef.current?.key;
    await act(async () => dynamicRef.current?.focus());
    await act(async () => show?.(false));
    await setup.waitFor(
      () =>
        rootRef.current?.store.getItemState(key as symbol) === undefined &&
        fallbackRef.current?.focused === true,
    );

    expect(dynamicRef.current).toBeNull();
  });
});
