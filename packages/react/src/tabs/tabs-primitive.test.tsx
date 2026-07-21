import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { TestRecorder, type TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  TabsListRenderable,
  TabsPanelRenderable,
  type TabsPanelState,
  TabsRootRenderable,
  TabsStore,
  TabsTabRenderable,
} from "@tuiparts/core/tabs";
import {
  act,
  createElement,
  createRef,
  Fragment,
  type ReactNode,
  StrictMode,
  useState,
} from "react";
import { Tabs } from "./index";

let setup: TestRendererSetup | undefined;

async function destroySetup(): Promise<void> {
  if (!setup) return;
  const renderer = setup.renderer;
  setup = undefined;
  const key = "IS_REACT_ACT_ENVIRONMENT";
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  // OpenTUI's test renderer resets this flag inside its onDestroy callback,
  // before this outer act scope has finished flushing teardown subscriptions.
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
    await act(async () => setup?.waitFor(() => alpha.getState().available));

    expect(list.store).toBe(root.store);
    expect(alpha.store).toBe(root.store);
    await act(async () => beta.press());
    await act(async () => setup?.waitFor(() => root.value === "beta"));
    expect(root.value).toBe("beta");
    expect(setup.renderer.root.findDescendantById("beta-panel")).toBeInstanceOf(
      TabsPanelRenderable,
    );
  });

  it("starts an invalid controlled Panel from authoritative inactive state", async () => {
    const observed: Array<{ active: boolean; associated: boolean }> = [];
    setup = await testRender(
      createElement(
        Tabs.Root,
        { value: "missing" },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { value: "alpha" }),
        ),
        createElement(Tabs.Panel, {
          id: "invalid-conditional",
          value: "missing",
        }),
        createElement(Tabs.Panel, { keepMounted: true, value: "missing" }, ((
          state: TabsPanelState,
        ) => {
          observed.push({
            active: state.active,
            associated: state.associated,
          });
          return null;
        }) as unknown as ReactNode),
      ),
      { width: 20, height: 4 },
    );

    expect(observed[0]).toEqual({ active: false, associated: false });
    expect(
      setup.renderer.root.findDescendantById("invalid-conditional"),
    ).toBeUndefined();
  });

  it("does not mount a default conditional Panel while consumer-visible is false", async () => {
    const refs: Array<TabsPanelRenderable | null> = [];
    let setVisible: (visible: boolean) => void = () => {};
    function App() {
      const [visible, updateVisible] = useState(false);
      setVisible = updateVisible;
      return createElement(
        Tabs.Root,
        { defaultValue: "alpha" },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { value: "alpha" }),
        ),
        createElement(Tabs.Panel, {
          id: "consumer-visible-panel",
          ref: (value) => {
            refs.push(value);
          },
          value: "alpha",
          visible,
        }),
      );
    }
    setup = await testRender(createElement(App), { width: 20, height: 4 });
    expect(
      setup.renderer.root.findDescendantById("consumer-visible-panel"),
    ).toBeUndefined();
    expect(refs).toEqual([]);

    await act(async () => setVisible(true));
    await act(async () =>
      setup?.waitFor(() =>
        refs.some((value) => value instanceof TabsPanelRenderable),
      ),
    );
    expect(
      setup.renderer.root.findDescendantById("consumer-visible-panel"),
    ).toBeInstanceOf(TabsPanelRenderable);

    await act(async () => setVisible(false));
    await act(async () =>
      setup?.waitFor(
        () =>
          setup?.renderer.root.findDescendantById("consumer-visible-panel") ===
          undefined,
      ),
    );
    expect(refs.at(-1)).toBeNull();
  });

  it("never renders a controlled frame with the wrong conditional Panel", async () => {
    let setValue: (value: string) => void = () => {};
    function App() {
      const [value, updateValue] = useState("alpha");
      setValue = updateValue;
      return createElement(
        Tabs.Root,
        { value },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { value: "alpha" }),
          createElement(Tabs.Tab, { value: "beta" }),
        ),
        createElement(
          Fragment,
          null,
          createElement(
            Tabs.Panel,
            { value: "alpha" },
            createElement("text", { content: "A" }),
          ),
          createElement(
            Tabs.Panel,
            { value: "beta" },
            createElement("text", { content: "B" }),
          ),
        ),
      );
    }
    setup = await testRender(createElement(App), { width: 4, height: 2 });
    await act(async () => setup?.renderOnce());
    expect(setup.captureCharFrame().trim()).toBe("A");
    const recorder = new TestRecorder(setup.renderer);

    recorder.rec();
    await act(async () => setValue("beta"));
    await act(async () => setup?.waitForFrame((frame) => frame.trim() === "B"));
    recorder.stop();

    expect(recorder.recordedFrames.length).toBeGreaterThan(0);
    expect(
      recorder.recordedFrames.every(({ frame }) => frame.trim() === "B"),
    ).toBe(true);
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
    await act(async () =>
      setup?.waitFor(() => rootRef.current?.value === "beta"),
    );
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
    await act(async () =>
      setup?.waitFor(() =>
        panelRefs.some((value) => value instanceof TabsPanelRenderable),
      ),
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
    await act(async () => setup?.waitFor(() => retained.visible));
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
    await destroySetup();

    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      const orphans = [
        ["List", createElement(Tabs.List, { id: "orphan-list" })],
        ["Tab", createElement(Tabs.Tab, { value: "orphan" })],
        ["Panel", createElement(Tabs.Panel, { value: "orphan" })],
      ] as const;
      for (const [part, orphan] of orphans) {
        setup = await testRender(orphan, { width: 10, height: 2 });
        expect(
          error.mock.calls.some((call) =>
            call.some((value) =>
              String(value).includes(
                `Tabs.${part} must be rendered inside Tabs.Root`,
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

  it("exposes public Root state through useRootState inside Tabs.Root only", async () => {
    const states: Tabs.Root.State[] = [];
    function Probe(): null {
      states.push(Tabs.useRootState());
      return null;
    }
    let setOrientation: (value: Tabs.Root.Orientation) => void = () => {};
    function Harness() {
      const [orientation, set] = useState<Tabs.Root.Orientation>("horizontal");
      setOrientation = set;
      return createElement(
        Tabs.Root,
        { id: "root", orientation },
        createElement(
          Tabs.List,
          null,
          createElement(Tabs.Tab, { value: "alpha" }),
        ),
        createElement(Probe),
      );
    }
    setup = await testRender(createElement(Harness), { width: 40, height: 6 });
    const first = states.at(-1);
    expect(first?.orientation).toBe("horizontal");
    expect(Object.isFrozen(first)).toBe(true);
    await act(async () => setOrientation("vertical"));
    await act(async () =>
      setup?.waitFor(() => states.at(-1)?.orientation === "vertical"),
    );
    expect(states.at(-1)?.orientation).toBe("vertical");
    await destroySetup();

    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      setup = await testRender(createElement(Probe), { width: 10, height: 2 });
      expect(
        error.mock.calls.some((call) =>
          call.some((value) =>
            String(value).includes(
              "Tabs.useRootState must be rendered inside Tabs.Root",
            ),
          ),
        ),
      ).toBe(true);
    } finally {
      error.mockRestore();
    }
  });

  it("releases every Store subscription on teardown", async () => {
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
      setup = await testRender(tree(), { width: 40, height: 6 });
      expect(activeSubscriptions).toBeGreaterThan(0);
      await destroySetup();
      expect(activeSubscriptions).toBe(0);
    } finally {
      TabsStore.prototype.subscribe = originalSubscribe;
    }
  });
});
