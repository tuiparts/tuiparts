import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { ToggleRenderable, ToggleStore } from "../toggle";
import { ToggleGroupRenderable, ToggleGroupStore } from "./index";

let setup: TestRendererSetup | undefined;

function keyEvent(name: string): KeyEvent {
  // SAFETY: These focused tests exercise only fields read by Toggle's key
  // handler; OpenTUI supplies the remaining KeyEvent fields at runtime.
  return { name } as KeyEvent;
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("ToggleGroup primitive", () => {
  it("owns single selection as an array and permits deselection", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const values: Array<readonly string[]> = [];
    const group = new ToggleGroupRenderable(setup.renderer, {
      defaultValue: ["left"],
      onValueChange: (value) => values.push(value),
    });
    const left = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "left",
    });
    const right = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "right",
    });
    group.add(left);
    group.add(right);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(left.pressed).toBe(true);
    right.press();
    expect(group.value).toEqual(["right"]);
    expect(left.pressed).toBe(false);
    expect(right.pressed).toBe(true);
    right.press();
    expect(group.value).toEqual([]);
    expect(values).toEqual([["right"], []]);
    expect(values.every(Object.isFrozen)).toBe(true);
  });

  it("supports multiple selection without duplicate values", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new ToggleGroupRenderable(setup.renderer, {
      defaultValue: ["bold"],
      multiple: true,
    });
    const bold = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "bold",
    });
    const italic = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "italic",
    });
    group.add(bold);
    group.add(italic);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    italic.press();
    expect(group.value).toEqual(["bold", "italic"]);
    bold.press();
    expect(group.value).toEqual(["italic"]);
  });

  it("does not notify for unavailable grouped activation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const itemChanges: boolean[] = [];
    const groupChanges: Array<readonly string[]> = [];
    const group = new ToggleGroupRenderable(setup.renderer, {
      onValueChange: (value) => groupChanges.push(value),
    });
    const item = new ToggleRenderable(setup.renderer, {
      group: group.store,
      onPressedChange: (pressed) => itemChanges.push(pressed),
      value: "alpha",
    });
    group.add(item);
    setup.renderer.root.add(group);
    await setup.renderOnce();
    item.visible = false;

    item.press();

    expect(itemChanges).toEqual([]);
    expect(groupChanges).toEqual([]);
    expect(group.value).toEqual([]);
  });

  it("commits grouped state before item and group callbacks in order", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const events: string[] = [];
    const details: object[] = [];
    const group = new ToggleGroupRenderable(setup.renderer, {
      onValueChange: (_value, changeDetails) => {
        events.push(`group:${group.value.join(",")}`);
        details.push(changeDetails);
      },
    });
    const item = new ToggleRenderable(setup.renderer, {
      group: group.store,
      onPressedChange: (_pressed, changeDetails) => {
        events.push(`item:${group.value.join(",")}`);
        details.push(changeDetails);
      },
      value: "alpha",
    });
    group.add(item);
    setup.renderer.root.add(group);

    item.press();

    expect(events).toEqual(["item:alpha", "group:alpha"]);
    expect(details[0]).toBe(details[1]);
    expect(details.every(Object.isFrozen)).toBe(true);
  });

  it("moves roving focus without changing selection and honors orientation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new ToggleGroupRenderable(setup.renderer, {
      defaultValue: ["alpha"],
      flexDirection: "column",
      orientation: "vertical",
    });
    const alpha = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "beta",
    });
    group.add(alpha);
    group.add(beta);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    alpha.focus();
    expect(alpha.handleKeyPress(keyEvent("right"))).toBe(false);
    expect(alpha.handleKeyPress(keyEvent("down"))).toBe(true);
    expect(beta.focused).toBe(true);
    expect(group.value).toEqual(["alpha"]);
    expect(beta.pressed).toBe(false);
  });

  it("skips disabled items, honors boundaries, and falls back when hidden", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const group = new ToggleGroupRenderable(setup.renderer, {
      loopFocus: false,
    });
    const alpha = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new ToggleRenderable(setup.renderer, {
      disabled: true,
      group: group.store,
      value: "beta",
    });
    const gamma = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "gamma",
    });
    group.add(alpha);
    group.add(beta);
    group.add(gamma);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    alpha.focus();
    expect(alpha.handleKeyPress(keyEvent("right"))).toBe(true);
    expect(gamma.focused).toBe(true);
    expect(gamma.handleKeyPress(keyEvent("right"))).toBe(false);
    expect(gamma.handleKeyPress(keyEvent("home"))).toBe(true);
    expect(alpha.focused).toBe(true);
    expect(alpha.handleKeyPress(keyEvent("end"))).toBe(true);
    expect(gamma.focused).toBe(true);

    gamma.visible = false;
    expect(alpha.focused).toBe(true);
    expect(beta.focused).toBe(false);
  });

  it("keeps the roving tab stop focusable without requiring focus first", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new ToggleGroupRenderable(setup.renderer);
    const alpha = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new ToggleRenderable(setup.renderer, {
      group: group.store,
      value: "beta",
    });
    group.add(alpha);
    group.add(beta);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(alpha.focusable).toBe(true);
    expect(beta.focusable).toBe(false);

    alpha.disabled = true;
    expect(alpha.focusable).toBe(false);
    expect(beta.focusable).toBe(true);
    expect(beta.getState().tabbable).toBe(true);
  });

  it("unregisters destroyed Toggles exactly once", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const group = new ToggleGroupRenderable(renderer);
    const item = new ToggleRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    group.add(item);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    item.destroy();
    item.destroy();

    const replacement = new ToggleRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    group.add(replacement);
    expect(replacement.value).toBe("alpha");
  });

  it("reports controlled intent without committing it and releases control", () => {
    const values: Array<readonly string[]> = [];
    const store = new ToggleGroupStore({
      value: ["alpha", "beta"],
      onValueChange: (value) => values.push(value),
    });
    const alpha = store.registerItem("alpha", { focus: () => {} });
    const beta = store.registerItem("beta", { focus: () => {} });

    expect(store.state.value).toEqual(["alpha"]);
    expect(Object.isFrozen(store.state)).toBe(true);
    expect(Object.isFrozen(store.state.value)).toBe(true);

    store.requestToggle(alpha.key, true, { source: "imperative" });
    expect(values).toEqual([]);

    store.requestToggle(beta.key, true, { source: "imperative" });
    expect(values).toEqual([["beta"]]);
    expect(store.state.value).toEqual(["alpha"]);

    store.setValue(["beta"]);
    store.setValue(undefined);
    store.requestToggle(alpha.key, true, { source: "imperative" });
    expect(store.state.value).toEqual(["alpha"]);
    expect(values).toEqual([["beta"], ["alpha"]]);
  });

  it("does not publish snapshots for no-op collection refreshes", () => {
    const store = new ToggleGroupStore();
    const item = store.registerItem("alpha", {
      focus: () => {},
      isAvailable: () => true,
    });
    const snapshots: object[] = [];
    store.subscribe((state) => snapshots.push(state));

    const initial = store.state;
    item.refreshAvailability();
    expect(store.state).toBe(initial);
    expect(snapshots).toEqual([]);

    item.setActive(true);
    expect(snapshots).toHaveLength(1);
    const active = store.state;
    item.setActive(true);
    item.refreshAvailability();
    expect(store.state).toBe(active);
    expect(snapshots).toHaveLength(1);
  });

  it("gates every activation seam while the group is disabled", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const values: Array<readonly string[]> = [];
    const group = new ToggleGroupRenderable(setup.renderer, {
      disabled: true,
      flexDirection: "row",
      height: 1,
      onValueChange: (value) => values.push(value),
    });
    const alpha = new ToggleRenderable(setup.renderer, {
      group: group.store,
      height: 1,
      value: "alpha",
      width: 5,
    });
    const beta = new ToggleRenderable(setup.renderer, {
      group: group.store,
      height: 1,
      value: "beta",
      width: 5,
    });
    group.add(alpha);
    group.add(beta);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    alpha.focus();
    alpha.press();
    expect(alpha.focusable).toBe(false);
    expect(alpha.focused).toBe(false);
    expect(alpha.handleKeyPress(keyEvent("space"))).toBe(false);
    const alphaKey = alpha.groupKey;
    if (!alphaKey) throw new Error("Expected alpha group registration");
    expect(group.store.getNavigationTarget(alphaKey, "next")).toBeUndefined();
    await setup.mockMouse.click(0, 0);
    expect(group.value).toEqual([]);
    expect(values).toEqual([]);

    group.disabled = false;
    await setup.mockMouse.click(5, 0);
    expect(group.value).toEqual(["beta"]);
  });

  it("applies explicit behavior props to a supplied Store", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const original = () => {};
    const replacementValues: Array<readonly string[]> = [];
    const store = new ToggleGroupStore({
      defaultValue: ["old"],
      onValueChange: original,
    });
    const group = new ToggleGroupRenderable(setup.renderer, {
      disabled: true,
      loopFocus: false,
      multiple: true,
      onValueChange: (value) => replacementValues.push(value),
      orientation: "vertical",
      store,
      value: ["alpha", "beta"],
    });

    expect(group.disabled).toBe(true);
    expect(group.loopFocus).toBe(false);
    expect(group.multiple).toBe(true);
    expect(group.orientation).toBe("vertical");
    expect(group.value).toEqual(["alpha", "beta"]);

    group.disabled = false;
    const item = new ToggleRenderable(setup.renderer, {
      group: store,
      value: "gamma",
    });
    group.add(item);
    setup.renderer.root.add(group);
    item.press();
    expect(replacementValues).toEqual([["alpha", "beta", "gamma"]]);
  });

  it("requires unique explicit values for grouped Toggles", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const group = new ToggleGroupRenderable(renderer);
    new ToggleRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    expect(
      () =>
        new ToggleRenderable(renderer, {
          group: group.store,
          value: "alpha",
        }),
    ).toThrow('ToggleGroup item value "alpha" is already registered');
    expect(() => new ToggleStore({ group: group.store })).toThrow(
      "A Toggle inside ToggleGroup requires a value",
    );
  });
});
