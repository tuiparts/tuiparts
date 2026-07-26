/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  AccordionItemRenderable,
  AccordionPanelRenderable,
  type AccordionRootRenderable,
  AccordionStore,
  AccordionTriggerRenderable,
} from "@tuiparts/core/accordion";
import { createSignal, ErrorBoundary, Show } from "solid-js";
import { Accordion } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Accordion", () => {
  it("provides reactive state and one Core interaction round-trip", async () => {
    let root: AccordionRootRenderable | undefined;
    let item: AccordionItemRenderable | undefined;
    let trigger: AccordionTriggerRenderable | undefined;
    setup = await testRender(
      () => (
        <Accordion.Root ref={(value) => (root = value)}>
          {(state: Accordion.Root.State) => (
            <>
              <Accordion.Item ref={(value) => (item = value)} value="a">
                <Accordion.Trigger
                  id="trigger"
                  ref={(value) => (trigger = value)}
                />
                <Accordion.Panel id="panel" />
              </Accordion.Item>
              <text content={`value:${state.value.join(",")}`} />
            </>
          )}
        </Accordion.Root>
      ),
      { width: 30, height: 5 },
    );
    if (!(trigger instanceof AccordionTriggerRenderable)) {
      throw new Error("Expected Accordion Trigger");
    }
    if (!(item instanceof AccordionItemRenderable)) {
      throw new Error("Expected Accordion Item");
    }
    if (!root) throw new Error("Expected Accordion Root");

    expect(item.store).toBe(root.store);
    expect(trigger.item).toBe(item);
    trigger.press();
    expect(root.value).toEqual(["a"]);
    await setup.waitFor(() => root?.value[0] === "a");
    await setup.waitForFrame((frame) => frame.includes("value:a"));
    expect(setup.renderer.root.findDescendantById("panel")).toBeInstanceOf(
      AccordionPanelRenderable,
    );
  });

  it("updates ownership, Item props, callbacks, refs, and identities", async () => {
    const calls: string[] = [];
    let root: AccordionRootRenderable | undefined;
    let item: AccordionItemRenderable | undefined;
    let trigger: AccordionTriggerRenderable | undefined;
    let panel: AccordionPanelRenderable | undefined;
    let update: () => void = () => {};
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<readonly string[] | undefined>(
          [],
        );
        const [itemValue, setItemValue] = createSignal("old");
        const [newCallback, setNewCallback] = createSignal(false);
        update = () => {
          setValue(undefined);
          setItemValue("new");
          setNewCallback(true);
        };
        return (
          <Accordion.Root
            onValueChange={(next) =>
              calls.push(`${newCallback() ? "new" : "old"}:${next.join(",")}`)
            }
            ref={(next) => (root = next)}
            value={value()}
          >
            <Accordion.Item ref={(next) => (item = next)} value={itemValue()}>
              <Accordion.Trigger ref={(next) => (trigger = next)} />
              <Accordion.Panel keepMounted ref={(next) => (panel = next)} />
            </Accordion.Item>
          </Accordion.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const retained = [root, item, trigger, panel];
    const store = root?.store;

    update();
    await setup.waitFor(() => item?.value === "new");
    trigger?.press();
    await setup.waitFor(() => root?.value[0] === "new");

    expect(calls).toEqual(["new:new"]);
    expect([root, item, trigger, panel]).toEqual(retained);
    expect(root?.store).toBe(store);
    expect(panel?.visible).toBe(true);

    setup.renderer.destroy();
    setup = undefined;
    expect(root).toBeUndefined();
    expect(item).toBeUndefined();
    expect(trigger).toBeUndefined();
    expect(panel).toBeUndefined();
  });

  it("mounts conditional Panels, retains identity, and reconciles Items", async () => {
    let trigger: AccordionTriggerRenderable | undefined;
    let conditional: AccordionPanelRenderable | undefined;
    let retained: AccordionPanelRenderable | undefined;
    let item: AccordionItemRenderable | undefined;
    let toggleItem: () => void = () => {};
    setup = await testRender(
      () => {
        const [shown, setShown] = createSignal(true);
        toggleItem = () => setShown((value) => !value);
        return (
          <Accordion.Root>
            <Show when={shown()}>
              <Accordion.Item ref={(value) => (item = value)} value="a">
                <Accordion.Trigger ref={(value) => (trigger = value)} />
                <Accordion.Panel
                  id="conditional"
                  ref={(value) => (conditional = value)}
                />
                <Accordion.Panel
                  id="retained"
                  keepMounted
                  ref={(value) => (retained = value)}
                />
              </Accordion.Item>
            </Show>
          </Accordion.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const retainedPanel = retained;
    const firstItem = item;
    expect(conditional).toBeUndefined();
    expect(retainedPanel?.visible).toBe(false);

    trigger?.press();
    await setup.waitFor(() => conditional instanceof AccordionPanelRenderable);
    expect(retained).toBe(retainedPanel);
    expect(retainedPanel?.visible).toBe(true);

    toggleItem();
    await setup.waitFor(() => item === undefined);
    toggleItem();
    await setup.waitFor(
      () => item instanceof AccordionItemRenderable && item !== firstItem,
    );
  });

  it("releases subscriptions and reports orphan errors", async () => {
    const originalSubscribe = AccordionStore.prototype.subscribe;
    let activeSubscriptions = 0;
    AccordionStore.prototype.subscribe = function subscribe(listener) {
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
          <Accordion.Root>
            <Accordion.Item value="a">
              <Accordion.Trigger />
              <Accordion.Panel keepMounted />
            </Accordion.Item>
          </Accordion.Root>
        ),
        { width: 20, height: 3 },
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      setup.renderer.destroy();
      setup = undefined;
      expect(activeSubscriptions).toBe(0);
    } finally {
      AccordionStore.prototype.subscribe = originalSubscribe;
    }

    const orphans = [
      ["Accordion.Item", "Accordion.Root", () => <Accordion.Item value="a" />],
      ["Accordion.Trigger", "Accordion.Item", () => <Accordion.Trigger />],
      ["Accordion.Panel", "Accordion.Item", () => <Accordion.Panel />],
    ] as const;
    for (const [part, owner, child] of orphans) {
      let error = "";
      setup = await testRender(
        () => (
          <ErrorBoundary
            fallback={(value: unknown) => {
              error = String(value);
              return null;
            }}
          >
            {child()}
          </ErrorBoundary>
        ),
        { width: 10, height: 2 },
      );
      expect(error).toContain(`${part} must be rendered inside ${owner}`);
      setup.renderer.destroy();
      setup = undefined;
    }
  });
});
