import { afterEach, describe, expect, it } from "bun:test";
import { type KeyEvent, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  type CollapsibleOpenChangeDetails,
  CollapsiblePanelRenderable,
  CollapsibleRootRenderable,
  CollapsibleStore,
  CollapsibleTriggerRenderable,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function key(name: string): KeyEvent {
  // SAFETY: PressableRenderable reads the key name and absent guard fields as
  // falsy. Tests of the complete OpenTUI KeyEvent guard matrix belong to the
  // shared Pressable suite.
  return { name } as KeyEvent;
}

async function createTree(
  options: ConstructorParameters<typeof CollapsibleRootRenderable>[1] = {},
): Promise<{
  panel: CollapsiblePanelRenderable;
  root: CollapsibleRootRenderable;
  trigger: CollapsibleTriggerRenderable;
}> {
  setup = await createTestRenderer({ width: 30, height: 6 });
  const root = new CollapsibleRootRenderable(setup.renderer, options);
  const trigger = new CollapsibleTriggerRenderable(setup.renderer, {
    height: 1,
    store: root.store,
    width: 10,
  });
  const panel = new CollapsiblePanelRenderable(setup.renderer, {
    store: root.store,
  });
  trigger.add(new TextRenderable(setup.renderer, { content: "Details" }));
  panel.add(new TextRenderable(setup.renderer, { content: "Panel content" }));
  root.add(trigger);
  root.add(panel);
  setup.renderer.root.add(root);
  await setup.renderOnce();
  return { panel, root, trigger };
}

describe("Collapsible primitive", () => {
  it("owns frozen, referentially stable uncontrolled state", () => {
    const store = new CollapsibleStore({ defaultOpen: true });
    const initial = store.state;
    const observed: boolean[] = [];
    store.subscribe((state) => observed.push(state.open));

    expect(initial).toEqual({ disabled: false, open: true });
    expect(Object.isFrozen(initial)).toBe(true);
    store.setDisabled(false);
    expect(store.state).toBe(initial);

    store.toggle();
    expect(store.state).toEqual({ disabled: false, open: false });
    expect(store.state).not.toBe(initial);
    expect(Object.isFrozen(store.state)).toBe(true);
    expect(observed).toEqual([false]);
  });

  it("reports immutable details once per accepted semantic request", () => {
    const changes: Array<{
      details: CollapsibleOpenChangeDetails;
      open: boolean;
      observed: boolean;
    }> = [];
    const store = new CollapsibleStore({
      onOpenChange: (open, details) =>
        changes.push({ details, observed: store.state.open, open }),
    });

    store.toggle();
    store.setOpen(true);
    const keyboard = { key: "space", source: "keyboard" } as const;
    store.setOpen(false, keyboard);

    expect(changes).toEqual([
      { details: { source: "imperative" }, observed: true, open: true },
      { details: keyboard, observed: false, open: false },
    ]);
    expect(changes.every(({ details }) => Object.isFrozen(details))).toBe(true);
  });

  it("reports controlled intent and releases control at the observed value", () => {
    const requests: boolean[] = [];
    const store = new CollapsibleStore({
      onOpenChange: (open) => requests.push(open),
      open: false,
    });

    store.toggle();
    expect(store.state.open).toBe(false);
    expect(requests).toEqual([true]);

    store.setControlledOpen(true);
    expect(store.state.open).toBe(true);
    store.setControlledOpen(undefined);
    store.toggle();
    expect(store.state.open).toBe(false);
    expect(requests).toEqual([true, false]);
  });

  it("adopts one external Store and applies explicit Root behavior props", async () => {
    setup = await createTestRenderer({ width: 30, height: 6 });
    const changes: boolean[] = [];
    const store = new CollapsibleStore({ defaultOpen: false });
    const root = new CollapsibleRootRenderable(setup.renderer, {
      disabled: true,
      onOpenChange: (open) => changes.push(open),
      open: true,
      store,
    });

    expect(root.store).toBe(store);
    expect(root.getState()).toEqual({ disabled: true, open: true });
    expect(() => {
      root.store = new CollapsibleStore();
    }).toThrow("Collapsible.Root store cannot be replaced");
    root.disabled = false;
    store.toggle();
    expect(changes).toEqual([false]);
    expect(root.open).toBe(true);
  });

  it("wires Trigger activation, focus, and Panel visibility", async () => {
    const changes: CollapsibleOpenChangeDetails[] = [];
    const { panel, root, trigger } = await createTree({
      onOpenChange: (_open, details) => changes.push(details),
    });

    expect(root.focusable).toBe(false);
    expect(panel.visible).toBe(false);
    expect(trigger.getState()).toEqual({
      disabled: false,
      focused: false,
      open: false,
    });

    trigger.focus();
    expect(trigger.getState().focused).toBe(true);
    expect(trigger.handleKeyPress(key("space"))).toBe(true);
    expect(root.open).toBe(true);
    expect(panel.visible).toBe(true);
    expect(trigger.focused).toBe(true);
    expect(trigger.getState()).toEqual({
      disabled: false,
      focused: true,
      open: true,
    });

    trigger.press();
    expect(root.open).toBe(false);
    expect(panel.visible).toBe(false);
    expect(trigger.focused).toBe(true);
    expect(changes).toEqual([
      { key: "space", source: "keyboard" },
      { source: "imperative" },
    ]);
  });

  it("inherits Root disablement at every Trigger seam", async () => {
    const requests: boolean[] = [];
    const { panel, root, trigger } = await createTree({
      defaultOpen: true,
      onOpenChange: (open) => requests.push(open),
    });
    trigger.focus();

    root.disabled = true;
    expect(trigger.focused).toBe(false);
    expect(trigger.focusable).toBe(false);
    expect(trigger.getState()).toEqual({
      disabled: true,
      focused: false,
      open: true,
    });
    trigger.press();
    expect(trigger.handleKeyPress(key("enter"))).toBe(false);
    await setup?.mockMouse.click(0, 0);
    expect(requests).toEqual([]);
    expect(panel.visible).toBe(true);

    root.disabled = undefined;
    expect(trigger.focusable).toBe(true);
  });

  it("wires one primary-pointer round-trip through shared Pressable behavior", async () => {
    const details: CollapsibleOpenChangeDetails[] = [];
    const { panel, trigger } = await createTree({
      onOpenChange: (_open, next) => details.push(next),
    });

    await setup?.mockMouse.click(0, 0);

    expect(panel.visible).toBe(true);
    expect(trigger.focused).toBe(true);
    expect(details).toEqual([{ button: 0, source: "pointer" }]);
  });

  it("combines consumer visibility with open state", async () => {
    const { panel, root } = await createTree({ defaultOpen: true });
    expect(panel.visible).toBe(true);

    panel.visible = false;
    expect(panel.visible).toBe(false);
    root.store.toggle();
    root.store.toggle();
    expect(panel.visible).toBe(false);

    panel.visible = undefined;
    expect(panel.visible).toBe(true);
  });

  it("permanently ends descendant coordination when Root is removed", async () => {
    const store = new CollapsibleStore();
    const { panel, root, trigger } = await createTree({ store });
    if (!setup) throw new Error("Expected test renderer");
    setup.renderer.root.remove(root);
    const endedState = trigger.getState();

    trigger.press();
    store.setOpen(true);
    expect(trigger.getState()).toBe(endedState);
    expect(panel.visible).toBe(false);

    setup.renderer.root.add(root);
    trigger.press();
    expect(store.state.open).toBe(true);

    const replacement = new CollapsibleRootRenderable(setup.renderer, {
      store,
    });
    expect(replacement.store).toBe(store);
    replacement.destroy();
  });
});
