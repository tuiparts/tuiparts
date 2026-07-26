/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  CollapsiblePanelRenderable,
  type CollapsibleRootRenderable,
  CollapsibleStore,
  CollapsibleTriggerRenderable,
} from "@tuiparts/core/collapsible";
import { createSignal, ErrorBoundary, Show } from "solid-js";
import { Collapsible } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Collapsible", () => {
  it("provides reactive state and one Core interaction round-trip", async () => {
    let root: CollapsibleRootRenderable | undefined;
    let trigger: CollapsibleTriggerRenderable | undefined;
    const observed: boolean[] = [];
    setup = await testRender(
      () => (
        <Collapsible.Root ref={(value) => (root = value)}>
          {(state: Collapsible.Root.State) => {
            observed.push(state.open);
            return (
              <>
                <Collapsible.Trigger
                  id="trigger"
                  ref={(value) => (trigger = value)}
                />
                <Collapsible.Panel id="panel" />
              </>
            );
          }}
        </Collapsible.Root>
      ),
      { width: 30, height: 5 },
    );
    if (!(trigger instanceof CollapsibleTriggerRenderable)) {
      throw new Error("Expected Collapsible Trigger");
    }

    if (!root) throw new Error("Expected Collapsible Root");
    expect(trigger.store).toBe(root.store);
    trigger.press();
    await setup.waitFor(() => root?.open === true);
    expect(observed.at(-1)).toBe(true);
    expect(setup.renderer.root.findDescendantById("panel")).toBeInstanceOf(
      CollapsiblePanelRenderable,
    );
  });

  it("reactively updates ownership, props, callback, refs, and retained identity", async () => {
    const calls: string[] = [];
    let root: CollapsibleRootRenderable | undefined;
    let trigger: CollapsibleTriggerRenderable | undefined;
    let panel: CollapsiblePanelRenderable | undefined;
    let release: () => void = () => {};
    let enable: () => void = () => {};
    let replace: () => void = () => {};
    setup = await testRender(
      () => {
        const [open, setOpen] = createSignal<boolean | undefined>(false);
        const [disabled, setDisabled] = createSignal(true);
        const [newCallback, setNewCallback] = createSignal(false);
        release = () => setOpen(undefined);
        enable = () => setDisabled(false);
        replace = () => setNewCallback(true);
        return (
          <Collapsible.Root
            disabled={disabled()}
            onOpenChange={(next) =>
              calls.push(`${newCallback() ? "new" : "old"}:${next}`)
            }
            open={open()}
            ref={(value) => (root = value)}
          >
            <Collapsible.Trigger ref={(value) => (trigger = value)} />
            <Collapsible.Panel keepMounted ref={(value) => (panel = value)} />
          </Collapsible.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const retainedRoot = root;
    const retainedTrigger = trigger;
    const retainedPanel = panel;
    const retainedStore = root?.store;

    enable();
    replace();
    release();
    await setup.waitFor(() => root?.disabled === false);
    trigger?.press();
    await setup.waitFor(() => root?.open === true);

    expect(calls).toEqual(["new:true"]);
    expect(root).toBe(retainedRoot);
    expect(trigger).toBe(retainedTrigger);
    expect(panel).toBe(retainedPanel);
    expect(root?.store).toBe(retainedStore);
    expect(panel?.visible).toBe(true);

    setup.renderer.destroy();
    setup = undefined;
    expect(root).toBeUndefined();
    expect(trigger).toBeUndefined();
    expect(panel).toBeUndefined();
  });

  it("mounts conditional Panels and retains keepMounted identity", async () => {
    let trigger: CollapsibleTriggerRenderable | undefined;
    let conditional: CollapsiblePanelRenderable | undefined;
    let retained: CollapsiblePanelRenderable | undefined;
    setup = await testRender(
      () => (
        <Collapsible.Root>
          <Collapsible.Trigger ref={(value) => (trigger = value)} />
          <Collapsible.Panel
            id="conditional"
            ref={(value) => (conditional = value)}
          />
          <Collapsible.Panel
            id="retained"
            keepMounted
            ref={(value) => (retained = value)}
          />
        </Collapsible.Root>
      ),
      { width: 30, height: 5 },
    );
    const retainedPanel = retained;
    expect(conditional).toBeUndefined();
    expect(retainedPanel).toBeInstanceOf(CollapsiblePanelRenderable);
    expect(retainedPanel?.visible).toBe(false);

    trigger?.press();
    await setup.waitFor(
      () => conditional instanceof CollapsiblePanelRenderable,
    );
    expect(retained).toBe(retainedPanel);
    expect(retainedPanel?.visible).toBe(true);

    trigger?.press();
    await setup.waitFor(() => conditional === undefined);
    expect(retained).toBe(retainedPanel);
    expect(retainedPanel?.visible).toBe(false);
  });

  it("reconciles dynamic Parts without replacing Root or Store", async () => {
    let root: CollapsibleRootRenderable | undefined;
    let trigger: CollapsibleTriggerRenderable | undefined;
    let toggleTrigger: () => void = () => {};
    setup = await testRender(
      () => {
        const [shown, setShown] = createSignal(true);
        toggleTrigger = () => setShown((value) => !value);
        return (
          <Collapsible.Root ref={(value) => (root = value)}>
            <Show when={shown()}>
              <Collapsible.Trigger ref={(value) => (trigger = value)} />
            </Show>
            <Collapsible.Panel keepMounted />
          </Collapsible.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const retainedRoot = root;
    const retainedStore = root?.store;
    const firstTrigger = trigger;

    toggleTrigger();
    await setup.waitFor(() => trigger === undefined);
    toggleTrigger();
    await setup.waitFor(
      () =>
        trigger instanceof CollapsibleTriggerRenderable &&
        trigger !== firstTrigger,
    );

    expect(root).toBe(retainedRoot);
    expect(root?.store).toBe(retainedStore);
    trigger?.press();
    expect(root?.open).toBe(true);
  });

  it("releases subscriptions and reports orphan Part errors", async () => {
    const originalSubscribe = CollapsibleStore.prototype.subscribe;
    let activeSubscriptions = 0;
    CollapsibleStore.prototype.subscribe = function subscribe(listener) {
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
          <Collapsible.Root>
            <Collapsible.Trigger />
            <Collapsible.Panel keepMounted />
          </Collapsible.Root>
        ),
        { width: 20, height: 3 },
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      setup.renderer.destroy();
      setup = undefined;
      expect(activeSubscriptions).toBe(0);
    } finally {
      CollapsibleStore.prototype.subscribe = originalSubscribe;
    }

    for (const [expected, child] of [
      ["Collapsible.Trigger", () => <Collapsible.Trigger />],
      ["Collapsible.Panel", () => <Collapsible.Panel />],
    ] as const) {
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
      expect(error).toContain(
        `${expected} must be rendered inside Collapsible.Root`,
      );
      setup.renderer.destroy();
      setup = undefined;
    }
  });
});
