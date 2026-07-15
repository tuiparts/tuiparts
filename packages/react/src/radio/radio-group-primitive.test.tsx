import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { RadioRootRenderable, type RadioState } from "@tuiparts/core/radio";
import { RadioGroupRenderable } from "@tuiparts/core/radio-group";
import { act, createElement, createRef, type ReactNode, useState } from "react";
import { RadioGroup } from "../radio-group";
import { Radio } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React RadioGroup", () => {
  it("composes parts and publishes Item-owned focus while navigating", async () => {
    const renderState = (state: RadioState) =>
      createElement("text", {
        id: "alpha-state",
        content: `${state.checked}:${state.focused}:${state.tabbable}`,
      });
    setup = await testRender(
      createElement(
        RadioGroup,
        { id: "root", defaultValue: "alpha", flexDirection: "column" },
        createElement(
          Radio.Root,
          { id: "alpha", value: "alpha", height: 1 },
          renderState as unknown as ReactNode,
        ),
        createElement(
          Radio.Root,
          { id: "beta", value: "beta", height: 1 },
          createElement(
            Radio.Indicator,
            { id: "beta-indicator", keepMounted: true },
            createElement("text", { content: "x" }),
          ),
        ),
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as RadioGroupRenderable;
    const alpha = setup.renderer.root.findDescendantById(
      "alpha",
    ) as RadioRootRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioRootRenderable;
    expect(root.constructor).toBe(RadioGroupRenderable);
    expect(alpha.constructor).toBe(RadioRootRenderable);
    expect(alpha.store).toBe(root.store);
    expect(
      setup.renderer.root.findDescendantById("beta-indicator"),
    ).toMatchObject({ visible: false });

    await act(async () => alpha.focus());
    await act(async () => setup?.mockInput.pressArrow("down"));
    await setup.waitFor(() => root.value === "beta" && beta.focused);

    expect(alpha.store.getItemState(alpha.key)).not.toHaveProperty("focused");
    expect(beta.getState()).toMatchObject({ focused: true, checked: true });
    expect(
      setup.renderer.root.findDescendantById("beta-indicator"),
    ).toBeDefined();
  });

  it("updates controlled props without replacing Root or Item", async () => {
    const rootRef = createRef<RadioGroupRenderable>();
    const itemRef = createRef<RadioRootRenderable>();
    let rename: (() => void) | undefined;
    function App() {
      const [value, setValue] = useState<string | null>("alpha");
      const [itemValue, setItemValue] = useState("alpha");
      rename = () => setItemValue("renamed");
      return createElement(
        RadioGroup,
        { value, onValueChange: setValue, ref: rootRef },
        createElement(Radio.Root, {
          id: "retained",
          value: itemValue,
          ref: itemRef,
        }),
        createElement(Radio.Root, { id: "beta", value: "beta" }),
      );
    }
    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = rootRef.current;
    const item = itemRef.current;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioRootRenderable;

    await act(async () => beta.press());
    await setup.waitFor(() => rootRef.current?.value === "beta");
    await act(async () => rename?.());
    await setup.waitFor(() => itemRef.current?.value === "renamed");

    expect(rootRef.current).toBe(root);
    expect(itemRef.current).toBe(item);
  });

  it("removes focused dynamic Items without stale registration", async () => {
    const rootRef = createRef<RadioGroupRenderable>();
    const fallbackRef = createRef<RadioRootRenderable>();
    const dynamicRef = createRef<RadioRootRenderable>();
    let show: ((visible: boolean) => void) | undefined;
    function App() {
      const [visible, setVisible] = useState(true);
      show = setVisible;
      return createElement(
        RadioGroup,
        { ref: rootRef },
        createElement(Radio.Root, {
          value: "fallback",
          ref: fallbackRef,
        }),
        visible
          ? createElement(Radio.Root, {
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
