import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, type KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
  CheckboxStore,
} from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Checkbox primitive", () => {
  it("accepts an externally owned Store without replacing it", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new CheckboxStore({ defaultChecked: true });
    const root = new CheckboxRootRenderable(setup.renderer, { store });

    expect(root.store).toBe(store);
    expect(root.getState()).toBe(store.state);
    root.press();
    expect(store.state.checked).toBe(false);
  });

  it("leaves visual assembly to the caller while sharing behavior with parts", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new CheckboxRootRenderable(setup.renderer, {
      defaultChecked: false,
      id: "checkbox-root",
    });
    const indicator = new CheckboxIndicatorRenderable(setup.renderer, {
      id: "checkbox-indicator",
      store: root.store,
    });

    expect(root.getChildren()).toEqual([]);
    root.add(indicator);
    setup.renderer.root.add(root);

    expect(root.checked).toBe(false);
    expect(indicator.visible).toBe(false);
    expect(indicator.store).toBe(root.store);

    root.press();

    expect(root.checked).toBe(true);
    expect(indicator.visible).toBe(true);
    expect(indicator.getState()).toEqual({
      checked: true,
      disabled: false,
      focused: false,
    });
    expect(Object.isFrozen(indicator.getState())).toBe(true);
  });

  it("reports controlled changes without mutating parent-owned state", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const root = new CheckboxRootRenderable(setup.renderer, {
      checked: false,
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(root);

    root.handleKeyPress({ name: "space" } as KeyEvent);

    expect(changes).toEqual([true]);
    expect(root.checked).toBe(false);

    root.checked = true;
    expect(root.checked).toBe(true);
  });

  it("suppresses focus and activation while disabled", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const root = new CheckboxRootRenderable(setup.renderer, {
      disabled: true,
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(root);

    expect(root.focusable).toBe(false);
    root.focus();
    root.press();

    expect(root.focused).toBe(false);
    expect(root.checked).toBe(false);
    expect(changes).toEqual([]);

    root.disabled = undefined;
    expect(root.focusable).toBe(true);
    root.press();
    expect(root.checked).toBe(true);
  });

  it("activates only uncancelled primary-button releases", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const secondary = new CheckboxRootRenderable(setup.renderer, {
      width: 5,
      height: 1,
      onCheckedChange: (checked) => changes.push(checked),
    });
    const cancelled = new CheckboxRootRenderable(setup.renderer, {
      width: 5,
      height: 1,
      onMouseUp: (event) => event.preventDefault(),
      onCheckedChange: (checked) => changes.push(checked),
    });
    const row = new BoxRenderable(setup.renderer, {
      width: 10,
      height: 1,
      flexDirection: "row",
    });
    row.add(secondary);
    row.add(cancelled);
    setup.renderer.root.add(row);
    await setup.renderOnce();

    await setup.mockMouse.click(0, 0, 2);
    expect(secondary.checked).toBe(false);

    await setup.mockMouse.click(5, 0);
    expect(cancelled.checked).toBe(false);

    await setup.mockMouse.click(0, 0);
    expect(secondary.checked).toBe(true);
    expect(secondary.focused).toBe(true);
    expect(changes).toEqual([true]);
  });

  it("returns to uncontrolled ownership when checked is removed", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new CheckboxRootRenderable(setup.renderer, { checked: false });
    setup.renderer.root.add(root);

    root.checked = undefined;
    root.press();

    expect(root.checked).toBe(true);
  });

  it("stops accepting semantic actions after destruction", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const root = new CheckboxRootRenderable(setup.renderer, {
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(root);

    root.destroy();

    root.press();
    expect(root.handleKeyPress({ name: "space" } as KeyEvent)).toBe(false);
    expect(root.checked).toBe(false);
    expect(changes).toEqual([]);
  });
});
