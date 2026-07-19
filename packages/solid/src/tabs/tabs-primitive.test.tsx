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
