import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { TestRecorder, type TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  CollapsiblePanelRenderable,
  CollapsibleRootRenderable,
  CollapsibleStore,
  CollapsibleTriggerRenderable,
} from "@tuiparts/core/collapsible";
import {
  act,
  createElement,
  createRef,
  type ReactNode,
  StrictMode,
  useState,
} from "react";
import { Collapsible } from "./index";

let setup: TestRendererSetup | undefined;

async function destroySetup(): Promise<void> {
  if (!setup) return;
  const renderer = setup.renderer;
  setup = undefined;
  const key = "IS_REACT_ACT_ENVIRONMENT";
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, {
    configurable: true,
    get: () => true,
    set: () => {},
  });
  try {
    await act(async () => renderer.destroy());
  } finally {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
}

afterEach(async () => {
  await destroySetup();
});

function tree(rootProps: Collapsible.Root.Props = {}) {
  return createElement(
    Collapsible.Root,
    { ...rootProps, id: "root" },
    createElement(
      Collapsible.Trigger,
      { id: "trigger" },
      createElement("text", { content: "Details" }),
    ),
    createElement(
      Collapsible.Panel,
      { id: "panel" },
      createElement("text", { content: "Content" }),
    ),
  );
}

describe("React Collapsible", () => {
  it("uses one authoritative Store and wires one interaction round-trip", async () => {
    setup = await testRender(tree(), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById("root");
    const trigger = setup.renderer.root.findDescendantById("trigger");
    if (!(root instanceof CollapsibleRootRenderable)) {
      throw new Error("Expected Collapsible Root");
    }
    if (!(trigger instanceof CollapsibleTriggerRenderable)) {
      throw new Error("Expected Collapsible Trigger");
    }

    expect(trigger.store).toBe(root.store);
    await act(async () => trigger.press());
    await act(async () => setup?.waitFor(() => root.open));
    expect(setup.renderer.root.findDescendantById("panel")).toBeInstanceOf(
      CollapsiblePanelRenderable,
    );
  });

  it("provides authoritative initial Root and retained Panel state", async () => {
    const rootStates: Collapsible.Root.State[] = [];
    const panelStates: Collapsible.Panel.State[] = [];
    setup = await testRender(
      createElement(Collapsible.Root, { defaultOpen: true }, ((
        state: Collapsible.Root.State,
      ) => {
        rootStates.push(state);
        return createElement(Collapsible.Panel, { keepMounted: true }, ((
          panelState: Collapsible.Panel.State,
        ) => {
          panelStates.push(panelState);
          return null;
        }) as unknown as ReactNode);
      }) as unknown as ReactNode),
      { width: 20, height: 3 },
    );

    expect(rootStates[0]).toEqual({ disabled: false, open: true });
    expect(Object.isFrozen(rootStates[0])).toBe(true);
    expect(panelStates[0]).toEqual({ open: true });
    expect(Object.isFrozen(panelStates[0])).toBe(true);
  });

  it("never renders a controlled frame with stale Panel content", async () => {
    let setOpen: (open: boolean) => void = () => {};
    function App() {
      const [open, updateOpen] = useState(false);
      setOpen = updateOpen;
      return createElement(
        Collapsible.Root,
        { open },
        createElement(
          Collapsible.Panel,
          null,
          createElement("text", { content: "Open" }),
        ),
        createElement("text", { content: open ? "owner-open" : "closed" }),
      );
    }
    setup = await testRender(createElement(App), { width: 20, height: 3 });
    await act(async () => setup?.renderOnce());
    expect(setup.captureCharFrame()).not.toContain("Open");
    const recorder = new TestRecorder(setup.renderer);

    recorder.rec();
    await act(async () => setOpen(true));
    await act(async () =>
      setup?.waitForFrame((frame) => frame.includes("Open")),
    );
    recorder.stop();

    expect(recorder.recordedFrames.length).toBeGreaterThan(0);
    expect(
      recorder.recordedFrames.every(({ frame }) => frame.includes("Open")),
    ).toBe(true);
  });

  it("updates props and callbacks without replacing refs or the Store", async () => {
    const calls: string[] = [];
    const rootRef = createRef<CollapsibleRootRenderable>();
    const triggerRef = createRef<CollapsibleTriggerRenderable>();
    let release: () => void = () => {};
    let enable: () => void = () => {};
    let replace: () => void = () => {};
    function App() {
      const [open, setOpen] = useState<boolean | undefined>(false);
      const [disabled, setDisabled] = useState(true);
      const [newCallback, setNewCallback] = useState(false);
      release = () => setOpen(undefined);
      enable = () => setDisabled(false);
      replace = () => setNewCallback(true);
      return createElement(
        Collapsible.Root,
        {
          disabled,
          onOpenChange: (next) =>
            calls.push(`${newCallback ? "new" : "old"}:${next}`),
          open,
          ref: rootRef,
        },
        createElement(Collapsible.Trigger, { ref: triggerRef }),
        createElement(Collapsible.Panel, { keepMounted: true }),
      );
    }
    setup = await testRender(createElement(App), { width: 20, height: 3 });
    const retainedRoot = rootRef.current;
    const retainedTrigger = triggerRef.current;
    const retainedStore = rootRef.current?.store;

    await act(async () => enable());
    await act(async () => replace());
    await act(async () => release());
    await act(async () => triggerRef.current?.press());
    await act(async () => setup?.waitFor(() => rootRef.current?.open === true));

    expect(calls).toEqual(["new:true"]);
    expect(rootRef.current).toBe(retainedRoot);
    expect(triggerRef.current).toBe(retainedTrigger);
    expect(rootRef.current?.store).toBe(retainedStore);
  });

  it("exposes actual refs and conditional versus retained Panel lifecycle", async () => {
    const conditionalRefs: Array<CollapsiblePanelRenderable | null> = [];
    const retainedRef = createRef<CollapsiblePanelRenderable>();
    const triggerRef = createRef<CollapsibleTriggerRenderable>();
    setup = await testRender(
      createElement(
        Collapsible.Root,
        null,
        createElement(Collapsible.Trigger, { ref: triggerRef }),
        createElement(Collapsible.Panel, {
          id: "conditional",
          ref: (value) => {
            conditionalRefs.push(value);
          },
        }),
        createElement(Collapsible.Panel, {
          id: "retained",
          keepMounted: true,
          ref: retainedRef,
        }),
      ),
      { width: 20, height: 3 },
    );
    const retained = retainedRef.current;
    expect(retained).toBeInstanceOf(CollapsiblePanelRenderable);
    expect(retained?.visible).toBe(false);
    expect(conditionalRefs).toEqual([]);

    await act(async () => triggerRef.current?.press());
    await act(async () =>
      setup?.waitFor(() =>
        Boolean(setup?.renderer.root.findDescendantById("conditional")),
      ),
    );
    expect(retainedRef.current).toBe(retained);
    expect(retained?.visible).toBe(true);
    expect(conditionalRefs.at(-1)).toBeInstanceOf(CollapsiblePanelRenderable);

    await act(async () => triggerRef.current?.press());
    await act(async () =>
      setup?.waitFor(
        () =>
          setup?.renderer.root.findDescendantById("conditional") === undefined,
      ),
    );
    expect(conditionalRefs.at(-1)).toBeNull();
    expect(retainedRef.current).toBe(retained);
    expect(retained?.visible).toBe(false);
  });

  it("is StrictMode-safe, releases subscriptions, and rejects orphan Parts", async () => {
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
      setup = await testRender(createElement(StrictMode, null, tree()), {
        width: 30,
        height: 5,
      });
      expect(setup.renderer.root.findDescendantById("root")).toBeInstanceOf(
        CollapsibleRootRenderable,
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      await destroySetup();
      expect(activeSubscriptions).toBe(0);
    } finally {
      CollapsibleStore.prototype.subscribe = originalSubscribe;
    }

    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const [part, orphan] of [
        ["Trigger", createElement(Collapsible.Trigger, { key: "trigger" })],
        ["Panel", createElement(Collapsible.Panel, { key: "panel" })],
      ] as const) {
        setup = await testRender(orphan, { width: 10, height: 2 });
        expect(
          error.mock.calls.some((call) =>
            call.some((value) =>
              String(value).includes(
                `Collapsible.${part} must be rendered inside Collapsible.Root`,
              ),
            ),
          ),
        ).toBe(true);
        await destroySetup();
      }
    } finally {
      error.mockRestore();
    }
  });
});
