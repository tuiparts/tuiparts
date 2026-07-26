import { afterEach, describe, expect, it } from "bun:test";
import { type KeyEvent, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  AccordionItemRenderable,
  AccordionPanelRenderable,
  AccordionRootRenderable,
  AccordionStore,
  AccordionTriggerRenderable,
  type AccordionValueChangeDetails,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function key(name: string): KeyEvent {
  // SAFETY: PressableRenderable reads the key name and absent guard fields as
  // falsy. The complete KeyEvent guard matrix belongs to the Pressable suite.
  return { name } as KeyEvent;
}

async function createTree(
  options: ConstructorParameters<typeof AccordionRootRenderable>[1] = {},
): Promise<{
  first: {
    item: AccordionItemRenderable;
    panel: AccordionPanelRenderable;
    trigger: AccordionTriggerRenderable;
  };
  root: AccordionRootRenderable;
  second: {
    item: AccordionItemRenderable;
    panel: AccordionPanelRenderable;
    trigger: AccordionTriggerRenderable;
  };
}> {
  setup = await createTestRenderer({ width: 30, height: 10 });
  const renderer = setup.renderer;
  const root = new AccordionRootRenderable(renderer, {
    flexDirection: "column",
    ...options,
  });
  const createItem = (value: string) => {
    const item = new AccordionItemRenderable(renderer, {
      flexDirection: "column",
      store: root.store,
      value,
    });
    const trigger = new AccordionTriggerRenderable(renderer, {
      height: 1,
      item,
      width: 10,
    });
    const panel = new AccordionPanelRenderable(renderer, { item });
    trigger.add(new TextRenderable(renderer, { content: value }));
    panel.add(new TextRenderable(renderer, { content: `${value} panel` }));
    item.add(trigger);
    item.add(panel);
    root.add(item);
    return { item, panel, trigger };
  };
  const first = createItem("first");
  const second = createItem("second");
  setup.renderer.root.add(root);
  await setup.renderOnce();
  return { first, root, second };
}

describe("Accordion primitive", () => {
  it("normalizes frozen single and multiple Root state", () => {
    const single = new AccordionStore({ defaultValue: ["a", "a", "b"] });
    expect(single.state).toEqual({
      disabled: false,
      multiple: false,
      value: ["a"],
    });
    expect(Object.isFrozen(single.state)).toBe(true);
    expect(Object.isFrozen(single.state.value)).toBe(true);

    const multiple = new AccordionStore({
      defaultValue: ["a", "a", "b"],
      multiple: true,
    });
    expect(multiple.state.value).toEqual(["a", "b"]);
    const initial = multiple.state;
    multiple.setDisabled(false);
    expect(multiple.state).toBe(initial);
    multiple.setMultiple(false);
    expect(multiple.state.value).toEqual(["a"]);
  });

  it("commits before Item then Root callbacks with frozen details", async () => {
    const calls: string[] = [];
    const details: AccordionValueChangeDetails[] = [];
    setup = await createTestRenderer({ width: 20, height: 5 });
    const store = new AccordionStore({
      onValueChange: (value, nextDetails) => {
        calls.push(`root:${value.join(",")}:${store.state.value.join(",")}`);
        details.push(nextDetails);
      },
    });
    const root = new AccordionRootRenderable(setup.renderer, { store });
    const item = new AccordionItemRenderable(setup.renderer, {
      onOpenChange: (open, nextDetails) => {
        calls.push(`item:${open}:${store.state.value.join(",")}`);
        details.push(nextDetails);
      },
      store,
      value: "a",
    });
    root.add(item);
    setup.renderer.root.add(root);

    const keyboard = { key: "space", source: "keyboard" } as const;
    item.toggle(keyboard);

    expect(calls).toEqual(["item:true:a", "root:a:a"]);
    expect(details).toEqual([keyboard, keyboard]);
    expect(details.every(Object.isFrozen)).toBe(true);
  });

  it("reports controlled intent and releases control at the observed value", async () => {
    const requests: Array<readonly string[]> = [];
    setup = await createTestRenderer({ width: 20, height: 5 });
    const store = new AccordionStore({
      onValueChange: (value) => requests.push(value),
      value: [],
    });
    const root = new AccordionRootRenderable(setup.renderer, { store });
    const item = new AccordionItemRenderable(setup.renderer, {
      store,
      value: "a",
    });
    root.add(item);
    setup.renderer.root.add(root);

    item.toggle();
    expect(store.state.value).toEqual([]);
    expect(requests).toEqual([["a"]]);

    store.setValue(["a"]);
    store.setValue(undefined);
    item.toggle();
    expect(store.state.value).toEqual([]);
    expect(requests).toEqual([["a"], []]);
  });

  it("coordinates single and multiple Item values", async () => {
    const { first, root, second } = await createTree();

    first.item.toggle();
    expect(root.value).toEqual(["first"]);
    second.item.toggle();
    expect(root.value).toEqual(["second"]);
    second.item.toggle();
    expect(root.value).toEqual([]);

    root.multiple = true;
    first.item.toggle();
    second.item.toggle();
    expect(root.value).toEqual(["first", "second"]);
  });

  it("requires live unique values and repairs rename and removal", async () => {
    const { first, root, second } = await createTree({
      defaultValue: ["first", "second"],
      multiple: true,
    });

    expect(() => {
      second.item.value = "first";
    }).toThrow("Accordion Item value must be unique: first");

    first.item.value = "renamed";
    expect(root.value).toEqual(["renamed", "second"]);
    root.remove(second.item);
    expect(root.value).toEqual(["renamed"]);
  });

  it("wires Trigger activation, focus, and Panel visibility", async () => {
    const details: AccordionValueChangeDetails[] = [];
    const { first, root } = await createTree({
      onValueChange: (_value, next) => details.push(next),
    });

    expect(root.focusable).toBe(false);
    expect(first.item.focusable).toBe(false);
    expect(first.panel.visible).toBe(false);
    first.trigger.focus();
    expect(first.trigger.handleKeyPress(key("space"))).toBe(true);
    expect(first.panel.visible).toBe(true);
    expect(first.trigger.focused).toBe(true);
    expect(first.trigger.getState()).toEqual({
      disabled: false,
      focused: true,
      open: true,
      value: "first",
    });

    first.trigger.press();
    expect(first.panel.visible).toBe(false);
    expect(details).toEqual([
      { key: "space", source: "keyboard" },
      { source: "imperative" },
    ]);
  });

  it("combines Root and Item disablement and blurs a focused Trigger", async () => {
    const requests: Array<readonly string[]> = [];
    const { first, root, second } = await createTree({
      onValueChange: (value) => requests.push(value),
    });
    first.trigger.focus();

    first.item.disabled = true;
    expect(first.trigger.focused).toBe(false);
    expect(first.trigger.focusable).toBe(false);
    first.trigger.press();
    expect(requests).toEqual([]);
    expect(second.trigger.focusable).toBe(true);

    root.disabled = true;
    expect(second.trigger.focusable).toBe(false);
    root.disabled = undefined;
    expect(second.trigger.focusable).toBe(true);
  });

  it("moves focus with Up, Down, Home, and End without selecting", async () => {
    const { first, root, second } = await createTree();
    first.trigger.focus();

    expect(first.trigger.handleKeyPress(key("down"))).toBe(true);
    expect(second.trigger.focused).toBe(true);
    expect(root.value).toEqual([]);
    expect(second.trigger.handleKeyPress(key("home"))).toBe(true);
    expect(first.trigger.focused).toBe(true);
    expect(first.trigger.handleKeyPress(key("end"))).toBe(true);
    expect(second.trigger.focused).toBe(true);

    second.item.disabled = true;
    first.trigger.focus();
    expect(first.trigger.handleKeyPress(key("down"))).toBe(false);
    expect(first.trigger.focused).toBe(true);
  });

  it("wires one primary-pointer round-trip", async () => {
    const details: AccordionValueChangeDetails[] = [];
    const { first } = await createTree({
      onValueChange: (_value, next) => details.push(next),
    });

    await setup?.mockMouse.click(0, 0);

    expect(first.panel.visible).toBe(true);
    expect(first.trigger.focused).toBe(true);
    expect(details).toEqual([{ button: 0, source: "pointer" }]);
  });

  it("combines consumer Panel visibility with Item open state", async () => {
    const { first } = await createTree({ defaultValue: ["first"] });
    expect(first.panel.visible).toBe(true);

    first.panel.visible = false;
    first.item.toggle();
    first.item.toggle();
    expect(first.panel.visible).toBe(false);

    first.panel.visible = undefined;
    expect(first.panel.visible).toBe(true);
  });

  it("permanently ends descendant coordination when Root is removed", async () => {
    const store = new AccordionStore();
    const { first, root } = await createTree({ store });
    if (!setup) throw new Error("Expected test renderer");
    first.item.toggle();
    setup.renderer.root.remove(root);
    const endedState = first.trigger.getState();

    first.trigger.press();
    store.toggleItem("first");
    expect(first.trigger.getState()).toBe(endedState);
    expect(first.panel.visible).toBe(false);
    expect(store.state.value).toEqual(["first"]);

    const replacement = new AccordionRootRenderable(setup.renderer, { store });
    const replacementItem = new AccordionItemRenderable(setup.renderer, {
      store,
      value: "first",
    });
    expect(replacementItem.getState().open).toBe(true);
    replacement.add(replacementItem);
    replacement.destroy();
  });
});
