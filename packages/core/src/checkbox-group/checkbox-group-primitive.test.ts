import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { CheckboxRootRenderable, CheckboxStore } from "../checkbox";
import { CheckboxGroupRenderable, CheckboxGroupStore } from "./index";

let setup: TestRendererSetup | undefined;

function keyEvent(name: string): KeyEvent {
  // SAFETY: These focused tests exercise only fields read by Checkbox's key
  // handler; OpenTUI supplies the remaining KeyEvent fields at runtime.
  return { name } as KeyEvent;
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("CheckboxGroup primitive", () => {
  it("supports array selection without duplicate values", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new CheckboxGroupRenderable(setup.renderer, {
      defaultValue: ["bold"],
    });
    const bold = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      value: "bold",
    });
    const italic = new CheckboxRootRenderable(setup.renderer, {
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

  it("repairs an uncontrolled checked value when a Checkbox is renamed", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new CheckboxGroupRenderable(setup.renderer, {
      defaultValue: ["old"],
    });
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      value: "old",
    });
    group.add(item);

    item.value = "new";

    expect(group.value).toEqual(["new"]);
    expect(item.checked).toBe(true);
  });

  it("does not notify for unavailable grouped activation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const itemChanges: boolean[] = [];
    const groupChanges: Array<readonly string[]> = [];
    const group = new CheckboxGroupRenderable(setup.renderer, {
      onValueChange: (value) => groupChanges.push(value),
    });
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      onCheckedChange: (checked) => itemChanges.push(checked),
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
    const group = new CheckboxGroupRenderable(setup.renderer, {
      onValueChange: (_value, changeDetails) => {
        events.push(`group:${group.value.join(",")}`);
        details.push(changeDetails);
      },
    });
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      onCheckedChange: (_checked, changeDetails) => {
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

  it("reports imperative, keyboard, and pointer details once per activation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const sources: string[] = [];
    const group = new CheckboxGroupRenderable(setup.renderer, {
      onValueChange: (_value, details) => sources.push(details.source),
    });
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      height: 1,
      value: "alpha",
      width: 5,
    });
    group.add(item);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    item.press();
    expect(item.handleKeyPress(keyEvent("space"))).toBe(true);
    await setup.mockMouse.click(0, 0);

    expect(sources).toEqual(["imperative", "keyboard", "pointer"]);
  });

  it("moves roving focus without changing selection and honors orientation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const group = new CheckboxGroupRenderable(setup.renderer, {
      defaultValue: ["alpha"],
      flexDirection: "column",
      orientation: "vertical",
    });
    const alpha = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new CheckboxRootRenderable(setup.renderer, {
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
    expect(beta.checked).toBe(false);
  });

  it("skips disabled items, honors boundaries, and falls back when hidden", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const group = new CheckboxGroupRenderable(setup.renderer, {
      loopFocus: false,
      orientation: "horizontal",
    });
    const alpha = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new CheckboxRootRenderable(setup.renderer, {
      disabled: true,
      group: group.store,
      value: "beta",
    });
    const gamma = new CheckboxRootRenderable(setup.renderer, {
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
    const group = new CheckboxGroupRenderable(setup.renderer);
    const alpha = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      value: "alpha",
    });
    const beta = new CheckboxRootRenderable(setup.renderer, {
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

  it("unregisters destroyed Checkboxes exactly once", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const group = new CheckboxGroupRenderable(renderer, {
      defaultValue: ["alpha"],
    });
    const item = new CheckboxRootRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    group.add(item);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    group.remove(item);
    item.destroy();

    const replacement = new CheckboxRootRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    group.add(replacement);
    expect(replacement.value).toBe("alpha");
    expect(replacement.checked).toBe(true);
  });

  it("permanently ends descendant coordination when the group is removed", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const store = new CheckboxGroupStore({ defaultValue: ["alpha"] });
    const group = new CheckboxGroupRenderable(renderer, { store });
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: store,
      value: "alpha",
    });
    group.add(item);
    setup.renderer.root.add(group);
    await setup.renderOnce();
    expect(
      () =>
        new CheckboxGroupRenderable(renderer, {
          disabled: true,
          store,
        }),
    ).toThrow(
      "CheckboxGroup Store may be adopted by only one live CheckboxGroup",
    );
    expect(store.state.disabled).toBe(false);

    setup.renderer.root.remove(group);
    item.press();
    expect(store.state.value).toEqual(["alpha"]);

    const replacement = new CheckboxGroupRenderable(renderer, { store });
    const replacementItem = new CheckboxRootRenderable(renderer, {
      group: store,
      value: "alpha",
    });
    replacement.add(replacementItem);
    setup.renderer.root.add(replacement);
    await setup.renderOnce();
    replacementItem.press();
    expect(store.state.value).toEqual([]);
  });

  it("reports controlled intent without committing it and releases control", () => {
    const values: Array<readonly string[]> = [];
    const store = new CheckboxGroupStore({
      value: ["alpha", "beta"],
      onValueChange: (value) => values.push(value),
    });
    const alpha = store.registerItem("alpha", { focus: () => {} });
    store.registerItem("beta", { focus: () => {} });

    expect(store.state.value).toEqual(["alpha", "beta"]);
    expect(Object.isFrozen(store.state)).toBe(true);
    expect(Object.isFrozen(store.state.value)).toBe(true);

    store.requestToggle(alpha.key, false, { source: "imperative" });
    expect(values).toEqual([["beta"]]);
    expect(store.state.value).toEqual(["alpha", "beta"]);

    store.setValue(["beta"]);
    store.setValue(undefined);
    store.requestToggle(alpha.key, true, { source: "imperative" });
    expect(store.state.value).toEqual(["beta", "alpha"]);
    expect(values).toEqual([["beta"], ["beta", "alpha"]]);
  });

  it("does not publish snapshots for no-op collection refreshes", () => {
    const store = new CheckboxGroupStore();
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
    const group = new CheckboxGroupRenderable(setup.renderer, {
      disabled: true,
      flexDirection: "row",
      height: 1,
      onValueChange: (value) => values.push(value),
    });
    const alpha = new CheckboxRootRenderable(setup.renderer, {
      group: group.store,
      height: 1,
      value: "alpha",
      width: 5,
    });
    const beta = new CheckboxRootRenderable(setup.renderer, {
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
    const store = new CheckboxGroupStore({
      defaultValue: ["old"],
      onValueChange: original,
    });
    const group = new CheckboxGroupRenderable(setup.renderer, {
      disabled: true,
      loopFocus: false,
      onValueChange: (value) => replacementValues.push(value),
      orientation: "vertical",
      store,
      value: ["alpha", "beta"],
    });

    expect(group.disabled).toBe(true);
    expect(group.loopFocus).toBe(false);
    expect(group.orientation).toBe("vertical");
    expect(group.value).toEqual(["alpha", "beta"]);

    group.disabled = false;
    const item = new CheckboxRootRenderable(setup.renderer, {
      group: store,
      value: "gamma",
    });
    group.add(item);
    setup.renderer.root.add(group);
    item.press();
    expect(replacementValues).toEqual([["alpha", "beta", "gamma"]]);
  });

  it("requires unique explicit values for grouped Checkboxes", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const renderer = setup.renderer;
    const group = new CheckboxGroupRenderable(renderer);
    new CheckboxRootRenderable(renderer, {
      group: group.store,
      value: "alpha",
    });
    expect(
      () =>
        new CheckboxRootRenderable(renderer, {
          group: group.store,
          value: "alpha",
        }),
    ).toThrow('CheckboxGroup item value "alpha" is already registered');
    expect(() => new CheckboxStore({ group: group.store })).toThrow(
      "A Checkbox inside CheckboxGroup requires a value",
    );
  });
});
