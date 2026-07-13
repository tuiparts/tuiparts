import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, type KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { SwitchRootRenderable, SwitchThumbRenderable } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Switch primitive", () => {
  it("leaves visual assembly to the caller while sharing readonly state with Thumb", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new SwitchRootRenderable(setup.renderer, {
      defaultChecked: false,
      id: "switch-root",
    });
    const thumb = new SwitchThumbRenderable(setup.renderer, {
      store: root.store,
      id: "switch-thumb",
    });

    expect(root.getChildren()).toEqual([]);
    root.add(thumb);
    setup.renderer.root.add(root);

    expect(root.checked).toBe(false);
    expect(thumb.getState()).toEqual({
      checked: false,
      disabled: false,
      focused: false,
    });
    expect(Object.isFrozen(thumb.getState())).toBe(true);

    root.press();

    expect(root.checked).toBe(true);
    expect(thumb.getState().checked).toBe(true);
    expect(thumb.visible).toBe(true);
    expect(root.getChildren()[0]).toBe(thumb);
  });

  it("reports controlled requests and resumes ownership when checked is removed", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const root = new SwitchRootRenderable(setup.renderer, {
      checked: false,
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(root);

    root.press();
    expect(changes).toEqual([true]);
    expect(root.checked).toBe(false);

    root.checked = true;
    expect(root.checked).toBe(true);

    root.checked = undefined;
    root.press();
    expect(root.checked).toBe(false);
    expect(changes).toEqual([true, false]);
  });

  it("shares activation across press, Enter, and Space while disabled gates focus", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const root = new SwitchRootRenderable(setup.renderer, {
      disabled: true,
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(root);

    root.focus();
    root.press();
    expect(root.handleKeyPress({ name: "space" } as KeyEvent)).toBe(false);
    expect(root.focused).toBe(false);
    expect(changes).toEqual([]);

    root.disabled = undefined;
    expect(root.handleKeyPress({ name: "enter" } as KeyEvent)).toBe(true);
    expect(root.checked).toBe(true);
    expect(root.handleKeyPress({ name: "return" } as KeyEvent)).toBe(true);
    expect(root.checked).toBe(false);
    expect(root.handleKeyPress({ name: "space" } as KeyEvent)).toBe(true);
    expect(root.checked).toBe(true);
    expect(root.handleKeyPress({ name: "a" } as KeyEvent)).toBe(false);
    expect(changes).toEqual([true, false, true]);
  });

  it("activates only uncancelled primary-button releases", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const secondary = new SwitchRootRenderable(setup.renderer, {
      width: 5,
      height: 1,
      onCheckedChange: (checked) => changes.push(checked),
    });
    const cancelled = new SwitchRootRenderable(setup.renderer, {
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
});
