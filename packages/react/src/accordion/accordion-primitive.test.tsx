import { afterEach, describe, expect, it, spyOn } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  AccordionItemRenderable,
  AccordionPanelRenderable,
  AccordionRootRenderable,
  AccordionStore,
  AccordionTriggerRenderable,
} from "@tuiparts/core/accordion";
import {
  act,
  createElement,
  createRef,
  type ReactNode,
  StrictMode,
  useState,
} from "react";
import { Accordion } from "./index";

let setup: TestRendererSetup | undefined;

async function destroySetup(): Promise<void> {
  if (!setup) return;
  const renderer = setup.renderer;
  setup = undefined;
  await act(async () => renderer.destroy());
}

afterEach(async () => {
  await destroySetup();
});

function tree(rootProps: Accordion.Root.Props = {}) {
  return createElement(
    Accordion.Root,
    { ...rootProps, id: "root" },
    createElement(
      Accordion.Item,
      { id: "item", value: "details" },
      createElement(
        Accordion.Trigger,
        { id: "trigger" },
        createElement("text", { content: "Details" }),
      ),
      createElement(
        Accordion.Panel,
        { id: "panel" },
        createElement("text", { content: "Content" }),
      ),
    ),
  );
}

describe("React Accordion", () => {
  it("uses one Store and Item owner for one interaction round-trip", async () => {
    setup = await testRender(tree(), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById("root");
    const item = setup.renderer.root.findDescendantById("item");
    const trigger = setup.renderer.root.findDescendantById("trigger");
    if (!(root instanceof AccordionRootRenderable)) {
      throw new Error("Expected Accordion Root");
    }
    if (!(item instanceof AccordionItemRenderable)) {
      throw new Error("Expected Accordion Item");
    }
    if (!(trigger instanceof AccordionTriggerRenderable)) {
      throw new Error("Expected Accordion Trigger");
    }

    expect(item.store).toBe(root.store);
    expect(trigger.item).toBe(item);
    await act(async () => trigger.press());
    await act(async () => setup?.waitFor(() => item.getState().open));
    expect(setup.renderer.root.findDescendantById("panel")).toBeInstanceOf(
      AccordionPanelRenderable,
    );
  });

  it("provides authoritative initial Root, Item, and Panel state", async () => {
    const rootStates: Accordion.Root.State[] = [];
    const itemStates: Accordion.Item.State[] = [];
    const panelStates: Accordion.Panel.State[] = [];
    setup = await testRender(
      createElement(Accordion.Root, { defaultValue: ["a"] }, ((
        rootState: Accordion.Root.State,
      ) => {
        rootStates.push(rootState);
        return createElement(Accordion.Item, { value: "a" }, ((
          itemState: Accordion.Item.State,
        ) => {
          itemStates.push(itemState);
          return createElement(Accordion.Panel, { keepMounted: true }, ((
            panelState: Accordion.Panel.State,
          ) => {
            panelStates.push(panelState);
            return null;
          }) as unknown as ReactNode);
        }) as unknown as ReactNode);
      }) as unknown as ReactNode),
      { width: 20, height: 3 },
    );

    expect(rootStates[0]).toEqual({
      disabled: false,
      multiple: false,
      value: ["a"],
    });
    expect(itemStates[0]).toEqual({ disabled: false, open: true, value: "a" });
    expect(panelStates[0]).toEqual({ disabled: false, open: true, value: "a" });
    expect(Object.isFrozen(rootStates[0])).toBe(true);
  });

  it("updates controlled props and callbacks without replacing identities", async () => {
    const calls: string[] = [];
    const rootRef = createRef<AccordionRootRenderable>();
    const itemRef = createRef<AccordionItemRenderable>();
    const triggerRef = createRef<AccordionTriggerRenderable>();
    let update: () => void = () => {};
    function App() {
      const [value, setValue] = useState<readonly string[] | undefined>([]);
      const [itemValue, setItemValue] = useState("old");
      const [newCallback, setNewCallback] = useState(false);
      update = () => {
        setValue(undefined);
        setItemValue("new");
        setNewCallback(true);
      };
      return createElement(
        Accordion.Root,
        {
          onValueChange: (next) =>
            calls.push(`${newCallback ? "new" : "old"}:${next.join(",")}`),
          ref: rootRef,
          value,
        },
        createElement(
          Accordion.Item,
          { ref: itemRef, value: itemValue },
          createElement(Accordion.Trigger, { ref: triggerRef }),
          createElement(Accordion.Panel, { keepMounted: true }),
        ),
      );
    }
    setup = await testRender(createElement(App), { width: 20, height: 3 });
    const retained = [rootRef.current, itemRef.current, triggerRef.current];
    const store = rootRef.current?.store;

    await act(async () => update());
    await act(async () => triggerRef.current?.press());
    await act(async () =>
      setup?.waitFor(() => rootRef.current?.value[0] === "new"),
    );

    expect(calls).toEqual(["new:new"]);
    expect([rootRef.current, itemRef.current, triggerRef.current]).toEqual(
      retained,
    );
    expect(rootRef.current?.store).toBe(store);
  });

  it("exposes conditional versus retained Panel lifecycle", async () => {
    const conditionalRefs: Array<AccordionPanelRenderable | null> = [];
    const retainedRef = createRef<AccordionPanelRenderable>();
    const triggerRef = createRef<AccordionTriggerRenderable>();
    setup = await testRender(
      createElement(
        Accordion.Root,
        null,
        createElement(
          Accordion.Item,
          { value: "a" },
          createElement(Accordion.Trigger, { ref: triggerRef }),
          createElement(Accordion.Panel, {
            id: "conditional",
            ref: (value) => {
              conditionalRefs.push(value);
            },
          }),
          createElement(Accordion.Panel, {
            id: "retained",
            keepMounted: true,
            ref: retainedRef,
          }),
        ),
      ),
      { width: 20, height: 3 },
    );
    const retained = retainedRef.current;
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
    expect(conditionalRefs.at(-1)).toBeInstanceOf(AccordionPanelRenderable);

    await act(async () => triggerRef.current?.press());
    await act(async () =>
      setup?.waitFor(
        () =>
          setup?.renderer.root.findDescendantById("conditional") === undefined,
      ),
    );
    expect(conditionalRefs.at(-1)).toBeNull();
    expect(retained?.visible).toBe(false);
  });

  it("is StrictMode-safe, releases subscriptions, and rejects orphans", async () => {
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
      setup = await testRender(createElement(StrictMode, null, tree()), {
        width: 30,
        height: 5,
      });
      expect(activeSubscriptions).toBeGreaterThan(0);
      await destroySetup();
      expect(activeSubscriptions).toBe(0);
    } finally {
      AccordionStore.prototype.subscribe = originalSubscribe;
    }

    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      const orphans = [
        ["Item", createElement(Accordion.Item, { key: "item", value: "a" })],
        ["Trigger", createElement(Accordion.Trigger, { key: "trigger" })],
        ["Panel", createElement(Accordion.Panel, { key: "panel" })],
      ] as const;
      for (const [part, orphan] of orphans) {
        setup = await testRender(orphan, { width: 10, height: 2 });
        const owner = part === "Item" ? "Root" : "Item";
        expect(
          error.mock.calls.some((call) =>
            call.some((value) =>
              String(value).includes(
                `Accordion.${part} must be rendered inside Accordion.${owner}`,
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
