import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  TabsListRenderable,
  TabsPanelRenderable,
  TabsRootRenderable,
  TabsTabRenderable,
} from "@tuiparts/core/tabs";
import { act, createElement, createRef, StrictMode, useState } from "react";
import { Tabs } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

function tree(rootProps: Tabs.Root.Props = {}) {
  return createElement(
    Tabs.Root,
    { ...rootProps, id: "root" },
    createElement(
      Tabs.List,
      { flexDirection: "row", id: "list" },
      createElement(Tabs.Tab, { id: "alpha", value: "alpha" }),
      createElement(Tabs.Tab, { id: "beta", value: "beta" }),
    ),
    createElement(Tabs.Panel, { id: "alpha-panel", value: "alpha" }),
    createElement(Tabs.Panel, { id: "beta-panel", value: "beta" }),
  );
}

describe("React Tabs", () => {
  it("uses one authoritative Store and wires one interaction round-trip", async () => {
    setup = await testRender(tree(), { width: 40, height: 6 });
    const root = setup.renderer.root.findDescendantById("root");
    const list = setup.renderer.root.findDescendantById("list");
    const alpha = setup.renderer.root.findDescendantById("alpha");
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(root instanceof TabsRootRenderable))
      throw new Error("Expected Tabs Root");
    if (!(list instanceof TabsListRenderable))
      throw new Error("Expected Tabs List");
    if (!(alpha instanceof TabsTabRenderable))
      throw new Error("Expected alpha Tab");
    if (!(beta instanceof TabsTabRenderable))
      throw new Error("Expected beta Tab");
    await setup.waitFor(() => alpha.getState().available);

    expect(list.store).toBe(root.store);
    expect(alpha.store).toBe(root.store);
    await act(async () => beta.press());
    await setup.waitFor(() => root.value === "beta");
    expect(root.value).toBe("beta");
    expect(setup.renderer.root.findDescendantById("beta-panel")).toBeInstanceOf(
      TabsPanelRenderable,
    );
  });

  it("updates controlled props, callback replacement, and removal without remounting", async () => {
    const calls: string[] = [];
    let release: () => void = () => {};
    let replace: () => void = () => {};
    const rootRef = createRef<TabsRootRenderable>();
    function App() {
      const [value, setValue] = useState<string | null | undefined>("alpha");
      const [newCallback, setNewCallback] = useState(false);
      release = () => setValue(undefined);
      replace = () => setNewCallback(true);
      return tree({
        onValueChange: (next) => {
          calls.push(newCallback ? `new:${next}` : `old:${next}`);
          if (value !== undefined) setValue(next);
        },
        ref: rootRef,
        value,
      });
    }
    setup = await testRender(createElement(App), { width: 40, height: 6 });
    const retained = rootRef.current;
    const beta = setup.renderer.root.findDescendantById("beta");
    const alpha = setup.renderer.root.findDescendantById("alpha");
    if (
      !(beta instanceof TabsTabRenderable) ||
      !(alpha instanceof TabsTabRenderable)
    )
      throw new Error("Expected Tabs");

    await act(async () => beta.press());
    await setup.waitFor(() => rootRef.current?.value === "beta");
    await act(async () => replace());
    await act(async () => release());
    await act(async () => alpha.select());
    expect(calls).toEqual(["old:beta", "new:alpha"]);
    expect(rootRef.current).toBe(retained);
  });

  it("exposes actual refs and conditional versus retained Panel lifecycle", async () => {
    const panelRefs: Array<TabsPanelRenderable | null> = [];
    const tabRef = createRef<TabsTabRenderable>();
    setup = await testRender(
      createElement(
        Tabs.Root,
        { defaultValue: "alpha" },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { ref: tabRef, value: "alpha" }),
          createElement(Tabs.Tab, { id: "ref-beta", value: "beta" }),
        ),
        createElement(Tabs.Panel, {
          id: "conditional-panel",
          ref: (value) => {
            panelRefs.push(value);
          },
          value: "alpha",
        }),
        createElement(Tabs.Panel, {
          id: "retained-panel",
          keepMounted: true,
          value: "beta",
        }),
      ),
      { width: 40, height: 6 },
    );
    await setup.waitFor(() =>
      panelRefs.some((value) => value instanceof TabsPanelRenderable),
    );
    const conditional = panelRefs.find(
      (value): value is TabsPanelRenderable =>
        value instanceof TabsPanelRenderable,
    );
    const retained = setup.renderer.root.findDescendantById("retained-panel");
    const beta = setup.renderer.root.findDescendantById("ref-beta");
    if (!(conditional instanceof TabsPanelRenderable))
      throw new Error("Expected Panel ref");
    if (!(retained instanceof TabsPanelRenderable))
      throw new Error("Expected retained Panel");
    if (!(beta instanceof TabsTabRenderable))
      throw new Error("Expected beta Tab");
    expect(tabRef.current).toBeInstanceOf(TabsTabRenderable);

    await act(async () => beta.select());
    await setup.waitFor(() => retained.visible);
    expect(
      setup.renderer.root.findDescendantById("conditional-panel"),
    ).toBeUndefined();
    expect(panelRefs.at(-1)).toBeNull();
    expect(setup.renderer.root.findDescendantById("retained-panel")).toBe(
      retained,
    );
  });

  it("is StrictMode-safe and fails clearly for orphan Parts", async () => {
    setup = await testRender(createElement(StrictMode, null, tree()), {
      width: 40,
      height: 6,
    });
    expect(setup.renderer.root.findDescendantById("root")).toBeInstanceOf(
      TabsRootRenderable,
    );
    await act(async () => setup?.renderer.destroy());
    setup = undefined;

    expect(() => createElement(Tabs.List)).not.toThrow();
    setup = await testRender(createElement(Tabs.List, { id: "orphan-list" }), {
      width: 10,
      height: 2,
    });
    expect(
      setup.renderer.root.findDescendantById("orphan-list"),
    ).toBeUndefined();
  });
});
