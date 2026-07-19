import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, type KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  TabsListRenderable,
  TabsPanelRenderable,
  TabsRootRenderable,
  TabsStore,
  TabsTabRenderable,
} from "./index";

let setup: TestRendererSetup | undefined;

function keyEvent(name: string): KeyEvent {
  // SAFETY: The Tabs key handler reads only KeyEvent fields supplied here;
  // omitted fields are optional guards in OpenTUI's runtime event shape.
  return { name } as KeyEvent;
}

async function renderTabs(
  options: ConstructorParameters<typeof TabsRootRenderable>[1] = {},
) {
  setup = await createTestRenderer({ width: 40, height: 8 });
  const root = new TabsRootRenderable(setup.renderer, options);
  const list = new TabsListRenderable(setup.renderer, {
    flexDirection: "row",
    store: root.store,
  });
  const alpha = new TabsTabRenderable(setup.renderer, {
    height: 1,
    store: root.store,
    value: "alpha",
    width: 8,
  });
  const beta = new TabsTabRenderable(setup.renderer, {
    height: 1,
    store: root.store,
    value: "beta",
    width: 8,
  });
  const alphaPanel = new TabsPanelRenderable(setup.renderer, {
    store: root.store,
    value: "alpha",
  });
  const betaPanel = new TabsPanelRenderable(setup.renderer, {
    store: root.store,
    value: "beta",
  });
  list.add(alpha);
  list.add(beta);
  root.add(list);
  root.add(alphaPanel);
  root.add(betaPanel);
  setup.renderer.root.add(root);
  await setup.renderOnce();
  return { alpha, alphaPanel, beta, betaPanel, list, root };
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Tabs primitive", () => {
  it("owns initial selection and synchronizes associated Panel visibility", async () => {
    const { alpha, alphaPanel, betaPanel, root } = await renderTabs();

    expect(root.value).toBe("alpha");
    expect(alpha.getState()).toMatchObject({
      associated: true,
      available: true,
      selected: true,
      tabbable: true,
    });
    expect(alphaPanel.getState()).toEqual({
      active: true,
      associated: true,
      value: "alpha",
    });
    expect(alphaPanel.visible).toBe(true);
    expect(betaPanel.visible).toBe(false);
    expect(Object.isFrozen(root.getState())).toBe(true);
    expect(Object.isFrozen(alpha.getState())).toBe(true);
    expect(Object.isFrozen(alphaPanel.getState())).toBe(true);
  });

  it("reports controlled intent and releases ownership at the observed value", async () => {
    const changes: string[] = [];
    const { alpha, beta, root } = await renderTabs({
      onValueChange: (value) => changes.push(value),
      value: "alpha",
    });

    beta.select();
    expect(root.value).toBe("alpha");
    expect(changes).toEqual(["beta"]);
    root.value = "beta";
    root.value = undefined;
    alpha.select();
    expect(root.value).toBe("alpha");
    expect(changes).toEqual(["beta", "alpha"]);
  });

  it("uses frozen source details for imperative, keyboard, and pointer selection", async () => {
    const details: object[] = [];
    const { alpha, beta, root } = await renderTabs({
      onValueChange: (_value, changeDetails) => details.push(changeDetails),
    });

    beta.select();
    alpha.handleKeyPress(keyEvent("space"));
    await setup?.mockMouse.click(8, 0);

    expect(details).toEqual([
      { source: "imperative" },
      { key: "space", source: "keyboard" },
      { button: 0, source: "pointer" },
    ]);
    expect(details.every(Object.isFrozen)).toBe(true);
    expect(root.value).toBe("beta");
  });

  it("moves rendered-order focus and automatically activates by default", async () => {
    const changes: string[] = [];
    const { alpha, beta, root } = await renderTabs({
      onValueChange: (value, details) =>
        changes.push(`${value}:${details.source}`),
    });

    alpha.focus();
    expect(alpha.handleKeyPress(keyEvent("right"))).toBe(true);
    expect(beta.focused).toBe(true);
    expect(root.value).toBe("beta");
    expect(changes).toEqual(["beta:focus"]);
  });

  it("manual activation moves focus without selecting", async () => {
    const { alpha, beta, root } = await renderTabs({
      activationMode: "manual",
    });

    alpha.focus();
    alpha.handleKeyPress(keyEvent("right"));
    expect(beta.focused).toBe(true);
    expect(root.value).toBe("alpha");
    beta.handleKeyPress(keyEvent("enter"));
    expect(root.value).toBe("beta");
  });

  it("honors orientation, boundaries, disabled Tabs, and Root disablement", async () => {
    const { alpha, beta, root } = await renderTabs({
      loopFocus: false,
      orientation: "vertical",
    });
    beta.disabled = true;
    alpha.focus();

    expect(alpha.handleKeyPress(keyEvent("right"))).toBe(false);
    expect(alpha.handleKeyPress(keyEvent("down"))).toBe(false);
    beta.disabled = false;
    expect(alpha.handleKeyPress(keyEvent("down"))).toBe(true);
    expect(beta.handleKeyPress(keyEvent("down"))).toBe(false);
    root.disabled = true;
    expect(beta.focusable).toBe(false);
    beta.press();
    expect(root.value).toBe("beta");
  });

  it("repairs uncontrolled selection and focus after visibility and removal", async () => {
    const { alpha, alphaPanel, beta, root } = await renderTabs();
    alpha.focus();
    alpha.visible = false;

    expect(root.value).toBe("beta");
    expect(beta.focused).toBe(true);

    alphaPanel.destroy();
    beta.destroy();
    expect(root.value).toBe(null);
  });

  it("repairs a removed middle selection to the nearest next rendered Tab", async () => {
    const { beta, betaPanel, list, root } = await renderTabs({
      defaultValue: "beta",
    });
    if (!setup) throw new Error("Expected Tabs test renderer");
    const gamma = new TabsTabRenderable(setup.renderer, {
      store: root.store,
      value: "gamma",
    });
    const gammaPanel = new TabsPanelRenderable(setup.renderer, {
      store: root.store,
      value: "gamma",
    });
    list.add(gamma);
    root.add(gammaPanel);
    await setup.renderOnce();
    beta.select();
    expect(root.value).toBe("beta");

    beta.destroy();
    betaPanel.destroy();

    expect(root.value).toBe("gamma");
    gamma.destroy();
    gammaPanel.destroy();
    expect(root.value).toBe("alpha");
  });

  it("makes the owning Root unavailable through hidden and detached ancestors", async () => {
    setup = await createTestRenderer({ width: 40, height: 8 });
    const ancestor = new BoxRenderable(setup.renderer, {});
    const root = new TabsRootRenderable(setup.renderer);
    const list = new TabsListRenderable(setup.renderer, { store: root.store });
    const alpha = new TabsTabRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
    });
    const beta = new TabsTabRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
    });
    list.add(alpha);
    list.add(beta);
    root.add(list);
    ancestor.add(root);
    setup.renderer.root.add(ancestor);
    await setup.renderOnce();
    alpha.focus();

    root.visible = false;
    expect(root.value).toBe(null);
    expect(alpha.focused).toBe(false);
    beta.select();
    expect(root.value).toBe(null);
    root.visible = true;
    await setup.renderOnce();
    expect(root.value).toBe("alpha");
    alpha.focus();

    ancestor.visible = false;
    await setup.renderOnce();
    expect(root.value).toBe(null);
    expect(alpha.focused).toBe(false);
    expect(alpha.getState().tabbable).toBe(false);
    beta.select();
    expect(root.value).toBe(null);

    ancestor.visible = true;
    await setup.renderOnce();
    expect(root.value).toBe("alpha");
    setup.renderer.root.remove(ancestor);
    await setup.renderOnce();
    expect(root.value).toBe(null);
    expect(alpha.getState().available).toBe(false);
    beta.select();
    expect(root.value).toBe(null);
  });

  it("does not rewrite an unavailable controlled selection", async () => {
    const { alpha, beta, root } = await renderTabs({ value: "alpha" });
    alpha.visible = false;

    expect(root.value).toBe("alpha");
    expect(beta.getState().selected).toBe(false);
  });

  it("keeps focus and tab-stop truth after controlled automatic intent is rejected", async () => {
    const { alpha, beta, root } = await renderTabs({ value: "alpha" });
    alpha.focus();

    beta.select();
    expect(alpha.focused).toBe(true);
    expect(alpha.getState().tabbable).toBe(true);
    expect(beta.getState().tabbable).toBe(false);

    alpha.handleKeyPress(keyEvent("right"));
    expect(root.value).toBe("alpha");
    expect(alpha.getState().selected).toBe(true);
    expect(beta.focused).toBe(true);
    expect(beta.getState().tabbable).toBe(true);
  });

  it("serializes reentrant selection callbacks", async () => {
    const calls: string[] = [];
    let reentrantRoot: TabsRootRenderable | undefined;
    const { root } = await renderTabs({
      onValueChange: (value) => {
        calls.push(value);
        if (value === "beta") reentrantRoot?.store.select("alpha");
      },
    });
    reentrantRoot = root;

    root.store.select("beta");
    expect(root.value).toBe("alpha");
    expect(calls).toEqual(["beta", "alpha"]);
  });

  it("publishes a Panel value update without a stale intermediate snapshot", async () => {
    const { alphaPanel, betaPanel } = await renderTabs();
    betaPanel.destroy();
    const states: Array<{ active: boolean; value: string }> = [];
    alphaPanel.subscribe((state) =>
      states.push({ active: state.active, value: state.value }),
    );

    alphaPanel.value = "beta";

    expect(alphaPanel.getState()).toMatchObject({
      active: false,
      value: "beta",
    });
    expect(states.length).toBeGreaterThan(0);
    expect(states.every((state) => state.value === "beta")).toBe(true);
  });

  it("uses live rendered order through consumer wrappers", async () => {
    setup = await createTestRenderer({ width: 40, height: 8 });
    const root = new TabsRootRenderable(setup.renderer);
    const list = new TabsListRenderable(setup.renderer, { store: root.store });
    const wrapper = new TabsRootRenderable(setup.renderer);
    const beta = new TabsTabRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
    });
    const alpha = new TabsTabRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
    });
    wrapper.add(beta);
    list.add(wrapper);
    list.add(alpha);
    root.add(list);
    root.add(
      new TabsPanelRenderable(setup.renderer, {
        store: root.store,
        value: "alpha",
      }),
    );
    root.add(
      new TabsPanelRenderable(setup.renderer, {
        store: root.store,
        value: "beta",
      }),
    );
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(root.value).toBe("beta");
    beta.focus();
    beta.handleKeyPress(keyEvent("right"));
    expect(alpha.focused).toBe(true);
  });

  it("requires unique associations and exactly one live List", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const store = new TabsStore();
    new TabsListRenderable(renderer, { store });
    expect(() => new TabsListRenderable(renderer, { store })).toThrow(
      "Tabs.Root may contain only one live Tabs.List",
    );
    new TabsPanelRenderable(renderer, { store, value: "alpha" });
    expect(
      () => new TabsPanelRenderable(renderer, { store, value: "alpha" }),
    ).toThrow('Tabs.Panel value "alpha" is already registered');
  });

  it("unregisters destroyed Parts exactly once and permits replacement", async () => {
    const { alpha, alphaPanel, list, root } = await renderTabs();
    alpha.destroy();
    alpha.destroy();
    alphaPanel.destroy();
    alphaPanel.destroy();
    if (!setup) throw new Error("Expected Tabs test renderer");
    const renderer = setup.renderer;

    const replacementTab = new TabsTabRenderable(renderer, {
      store: root.store,
      value: "alpha",
    });
    const replacementPanel = new TabsPanelRenderable(renderer, {
      store: root.store,
      value: "alpha",
    });
    list.add(replacementTab);
    root.add(replacementPanel);
    await setup.renderOnce();
    replacementTab.select();
    expect(root.value).toBe("alpha");
  });

  it("makes every Tab unavailable when the List tears down", async () => {
    const { alpha, list, root } = await renderTabs();
    alpha.focus();

    list.destroy();

    expect(root.value).toBe(null);
    expect(alpha.focused).toBe(false);
    expect(alpha.focusable).toBe(false);
  });

  it("tears down Root subscriptions without destroying an adopted Store", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const store = new TabsStore();
    const originalSubscribe = store.subscribe.bind(store);
    let activeSubscriptions = 0;
    store.subscribe = (listener) => {
      activeSubscriptions += 1;
      const unsubscribe = originalSubscribe(listener);
      return () => {
        activeSubscriptions -= 1;
        unsubscribe();
      };
    };
    const root = new TabsRootRenderable(setup.renderer, { store });
    setup.renderer.root.add(root);
    expect(activeSubscriptions).toBe(1);

    root.destroy();

    expect(activeSubscriptions).toBe(0);
    store.setOrientation("vertical");
    expect(store.state.orientation).toBe("vertical");
    store.destroy();
  });
});
