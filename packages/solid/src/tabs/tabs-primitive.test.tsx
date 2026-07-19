/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  type TabsListRenderable,
  TabsPanelRenderable,
  type TabsPanelState,
  type TabsRootRenderable,
  TabsStore,
  TabsTabRenderable,
} from "@tuiparts/core/tabs";
import { createSignal } from "solid-js";
import { Tabs } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Tabs", () => {
  it("provides reactive state and one Core interaction round-trip", async () => {
    let root: TabsRootRenderable | undefined;
    setup = await testRender(
      () => (
        <Tabs.Root ref={(value) => (root = value)}>
          <Tabs.List flexDirection="row">
            <Tabs.Tab id="alpha" value="alpha" />
            <Tabs.Tab id="beta" value="beta" />
          </Tabs.List>
          <Tabs.Panel id="alpha-panel" value="alpha" />
          <Tabs.Panel id="beta-panel" value="beta" />
        </Tabs.Root>
      ),
      { width: 40, height: 6 },
    );
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(beta instanceof TabsTabRenderable))
      throw new Error("Expected beta Tab");
    beta.press();
    await setup.waitFor(() => root?.value === "beta");
    expect(root?.value).toBe("beta");
    expect(setup.renderer.root.findDescendantById("beta-panel")).toBeInstanceOf(
      TabsPanelRenderable,
    );
  });

  it("reactively updates ownership, props, callback, refs, and retained identity", async () => {
    const calls: string[] = [];
    let root: TabsRootRenderable | undefined;
    let list: TabsListRenderable | undefined;
    let tab: TabsTabRenderable | undefined;
    let retainedPanel: TabsPanelRenderable | undefined;
    let release: () => void = () => {};
    let replace: () => void = () => {};
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<string | null | undefined>(
          "alpha",
        );
        const [newCallback, setNewCallback] = createSignal(false);
        const [disabled, setDisabled] = createSignal(true);
        release = () => {
          setValue(undefined);
          setDisabled(false);
        };
        replace = () => setNewCallback(true);
        return (
          <Tabs.Root
            disabled={disabled()}
            onValueChange={(next) =>
              calls.push(`${newCallback() ? "new" : "old"}:${next}`)
            }
            ref={(value) => (root = value)}
            value={value()}
          >
            <Tabs.List ref={(value) => (list = value)}>
              <Tabs.Tab ref={(value) => (tab = value)} value="alpha" />
              <Tabs.Tab id="solid-beta" value="beta" />
            </Tabs.List>
            <Tabs.Panel
              keepMounted
              ref={(value) => (retainedPanel = value)}
              value="alpha"
            />
            <Tabs.Panel keepMounted value="beta" />
          </Tabs.Root>
        );
      },
      { width: 40, height: 6 },
    );
    const retainedRoot = root;
    const retainedTab = tab;
    const retained = retainedPanel;
    const beta = setup.renderer.root.findDescendantById("solid-beta");
    if (!(beta instanceof TabsTabRenderable))
      throw new Error("Expected beta Tab");
    expect(root?.disabled).toBe(true);

    release();
    replace();
    await setup.waitFor(() => root?.disabled === false);
    beta.select();
    expect(calls).toEqual(["new:beta"]);
    expect(root).toBe(retainedRoot);
    expect(tab).toBe(retainedTab);
    expect(retainedPanel).toBe(retained);
    expect(retained?.visible).toBe(false);

    setup.renderer.destroy();
    setup = undefined;
    expect(retainedPanel).toBeUndefined();
    expect(root).toBeUndefined();
    expect(list).toBeUndefined();
    expect(tab).toBeUndefined();
  });

  it("reactively changes orientation and layout without remounting or duplicate registration", async () => {
    const originalRegisterTab = TabsStore.prototype.registerTab;
    const originalRegisterPanel = TabsStore.prototype.registerPanel;
    let tabRegistrations = 0;
    let panelRegistrations = 0;
    TabsStore.prototype.registerTab = function registerTab(...args) {
      tabRegistrations += 1;
      return originalRegisterTab.apply(this, args);
    };
    TabsStore.prototype.registerPanel = function registerPanel(...args) {
      panelRegistrations += 1;
      return originalRegisterPanel.apply(this, args);
    };

    let root: TabsRootRenderable | undefined;
    let list: TabsListRenderable | undefined;
    let tab: TabsTabRenderable | undefined;
    let beta: TabsTabRenderable | undefined;
    let panel: TabsPanelRenderable | undefined;
    let setOrientation: (orientation: "horizontal" | "vertical") => void =
      () => {};
    try {
      setup = await testRender(
        () => {
          const [orientation, updateOrientation] = createSignal<
            "horizontal" | "vertical"
          >("horizontal");
          setOrientation = updateOrientation;
          return (
            <Tabs.Root
              orientation={orientation()}
              ref={(value) => (root = value)}
            >
              <Tabs.List
                flexDirection={orientation() === "vertical" ? "column" : "row"}
                ref={(value) => (list = value)}
              >
                <Tabs.Tab
                  height={1}
                  ref={(value) => (tab = value)}
                  value="alpha"
                  width={3}
                />
                <Tabs.Tab
                  height={1}
                  ref={(value) => (beta = value)}
                  value="beta"
                  width={3}
                />
              </Tabs.List>
              <Tabs.Panel
                keepMounted
                ref={(value) => (panel = value)}
                value="alpha"
              />
              <Tabs.Panel keepMounted value="beta" />
            </Tabs.Root>
          );
        },
        { width: 40, height: 6 },
      );
      const retainedRoot = root;
      const retainedList = list;
      const retainedTab = tab;
      const retainedPanel = panel;
      const retainedStore = root?.store;
      expect(tabRegistrations).toBe(2);
      expect(panelRegistrations).toBe(2);

      setOrientation("vertical");
      await setup.waitFor(
        () =>
          root?.orientation === "vertical" && (beta?.y ?? 0) > (tab?.y ?? 0),
      );
      expect(root).toBe(retainedRoot);
      expect(list).toBe(retainedList);
      expect(tab).toBe(retainedTab);
      expect(panel).toBe(retainedPanel);
      expect(root?.store).toBe(retainedStore);
      expect(tabRegistrations).toBe(2);
      expect(panelRegistrations).toBe(2);

      setOrientation("horizontal");
      await setup.waitFor(
        () =>
          root?.orientation === "horizontal" && (beta?.x ?? 0) > (tab?.x ?? 0),
      );
      expect(root).toBe(retainedRoot);
      expect(list).toBe(retainedList);
      expect(tab).toBe(retainedTab);
      expect(panel).toBe(retainedPanel);
      expect(tabRegistrations).toBe(2);
      expect(panelRegistrations).toBe(2);
    } finally {
      TabsStore.prototype.registerTab = originalRegisterTab;
      TabsStore.prototype.registerPanel = originalRegisterPanel;
    }
  });

  it("reconciles dynamic Parts and reruns Root state children", async () => {
    const observedOrientations: string[] = [];
    let setMounted: (mounted: boolean) => void = () => {};
    let setOrientation: (orientation: "horizontal" | "vertical") => void =
      () => {};
    setup = await testRender(
      () => {
        const [mounted, updateMounted] = createSignal(false);
        const [orientation, updateOrientation] = createSignal<
          "horizontal" | "vertical"
        >("horizontal");
        setMounted = updateMounted;
        setOrientation = updateOrientation;
        return (
          <Tabs.Root defaultValue="alpha" orientation={orientation()}>
            <Tabs.List>
              <Tabs.Tab value="alpha" />
              {mounted() && <Tabs.Tab id="dynamic-tab" value="beta" />}
            </Tabs.List>
            <Tabs.Panel keepMounted value="alpha" />
            {mounted() && (
              <Tabs.Panel id="dynamic-panel" keepMounted value="beta" />
            )}
          </Tabs.Root>
        );
      },
      { width: 40, height: 6 },
    );
    expect(
      setup.renderer.root.findDescendantById("dynamic-tab"),
    ).toBeUndefined();
    setMounted(true);
    await setup.waitFor(
      () =>
        setup?.renderer.root.findDescendantById("dynamic-tab") instanceof
          TabsTabRenderable &&
        setup?.renderer.root.findDescendantById("dynamic-panel") instanceof
          TabsPanelRenderable,
    );
    setMounted(false);
    await setup.waitFor(
      () =>
        setup?.renderer.root.findDescendantById("dynamic-tab") === undefined &&
        setup?.renderer.root.findDescendantById("dynamic-panel") === undefined,
    );

    setup.renderer.destroy();
    setup = await testRender(
      () => {
        const [orientation, updateOrientation] = createSignal<
          "horizontal" | "vertical"
        >("horizontal");
        setOrientation = updateOrientation;
        return (
          <Tabs.Root orientation={orientation()}>
            {(state: Tabs.Root.State) => {
              observedOrientations.push(state.orientation);
              return <text id="root-state" content={state.orientation} />;
            }}
          </Tabs.Root>
        );
      },
      { width: 40, height: 2 },
    );
    setOrientation("vertical");
    await setup.waitFor(() => observedOrientations.includes("vertical"));
    expect(observedOrientations).toContain("horizontal");
  });

  it("unmounts inactive Panels by default and rejects orphan Parts", async () => {
    let root: TabsRootRenderable | undefined;
    let panelRef: TabsPanelRenderable | undefined;
    setup = await testRender(
      () => (
        <Tabs.Root ref={(value) => (root = value)} defaultValue="alpha">
          <Tabs.List>
            <Tabs.Tab value="alpha" />
            <Tabs.Tab id="conditional-beta" value="beta" />
          </Tabs.List>
          <Tabs.Panel
            id="conditional-alpha"
            ref={(value) => (panelRef = value)}
            value="alpha"
          />
          <Tabs.Panel id="conditional-beta-panel" value="beta" />
        </Tabs.Root>
      ),
      { width: 40, height: 6 },
    );
    const beta = setup.renderer.root.findDescendantById("conditional-beta");
    if (!(beta instanceof TabsTabRenderable))
      throw new Error("Expected beta Tab");
    expect(
      setup.renderer.root.findDescendantById("conditional-beta-panel"),
    ).toBeUndefined();
    beta.select();
    await setup.waitFor(() => root?.value === "beta");
    expect(
      setup.renderer.root.findDescendantById("conditional-alpha"),
    ).toBeUndefined();
    expect(panelRef).toBeUndefined();

    setup.renderer.destroy();
    setup = undefined;
    await expect(
      testRender(() => <Tabs.List />, { width: 10, height: 2 }),
    ).rejects.toThrow("Tabs.List must be rendered inside Tabs.Root");
    await expect(
      testRender(() => <Tabs.Tab value="orphan" />, {
        width: 10,
        height: 2,
      }),
    ).rejects.toThrow("Tabs.Tab must be rendered inside Tabs.Root");
    await expect(
      testRender(() => <Tabs.Panel value="orphan" />, {
        width: 10,
        height: 2,
      }),
    ).rejects.toThrow("Tabs.Panel must be rendered inside Tabs.Root");
  });

  it("starts invalid controlled Panels from authoritative inactive state", async () => {
    let firstState: { active: boolean; associated: boolean } | undefined;
    setup = await testRender(
      () => (
        <Tabs.Root value="missing">
          <Tabs.List>
            <Tabs.Tab value="alpha" />
          </Tabs.List>
          <Tabs.Panel id="solid-invalid" value="missing" />
          <Tabs.Panel keepMounted value="missing">
            {(state: TabsPanelState) => {
              firstState ??= {
                active: state.active,
                associated: state.associated,
              };
              return null;
            }}
          </Tabs.Panel>
        </Tabs.Root>
      ),
      { width: 20, height: 4 },
    );

    expect(firstState).toEqual({ active: false, associated: false });
    expect(
      setup.renderer.root.findDescendantById("solid-invalid"),
    ).toBeUndefined();
  });

  it("does not mount a default conditional Panel while consumer-visible is false", async () => {
    let panel: TabsPanelRenderable | undefined;
    let setVisible: (visible: boolean) => void = () => {};
    setup = await testRender(
      () => {
        const [visible, updateVisible] = createSignal(false);
        setVisible = updateVisible;
        return (
          <Tabs.Root defaultValue="alpha">
            <Tabs.List>
              <Tabs.Tab value="alpha" />
            </Tabs.List>
            <Tabs.Panel
              id="solid-consumer-visible-panel"
              ref={(value) => (panel = value)}
              value="alpha"
              visible={visible()}
            />
          </Tabs.Root>
        );
      },
      { width: 20, height: 4 },
    );
    expect(panel).toBeUndefined();
    expect(
      setup.renderer.root.findDescendantById("solid-consumer-visible-panel"),
    ).toBeUndefined();

    setVisible(true);
    await setup.waitFor(() => panel instanceof TabsPanelRenderable);
    expect(
      setup.renderer.root.findDescendantById("solid-consumer-visible-panel"),
    ).toBeInstanceOf(TabsPanelRenderable);

    setVisible(false);
    await setup.waitFor(() => panel === undefined);
    expect(
      setup.renderer.root.findDescendantById("solid-consumer-visible-panel"),
    ).toBeUndefined();
  });

  it("releases every Store subscription on cleanup", async () => {
    const originalSubscribe = TabsStore.prototype.subscribe;
    let activeSubscriptions = 0;
    TabsStore.prototype.subscribe = function subscribe(listener) {
      activeSubscriptions += 1;
      const unsubscribe = originalSubscribe.call(this, listener);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        activeSubscriptions -= 1;
        unsubscribe();
      };
    };
    try {
      setup = await testRender(
        () => (
          <Tabs.Root>
            <Tabs.List>
              <Tabs.Tab value="alpha" />
            </Tabs.List>
            <Tabs.Panel keepMounted value="alpha" />
          </Tabs.Root>
        ),
        { width: 20, height: 4 },
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      setup.renderer.destroy();
      setup = undefined;
      expect(activeSubscriptions).toBe(0);
    } finally {
      TabsStore.prototype.subscribe = originalSubscribe;
    }
  });
});
