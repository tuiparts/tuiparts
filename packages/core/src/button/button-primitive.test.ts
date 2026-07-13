import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, type KeyEvent, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  type ButtonPressDetails,
  ButtonRenderable,
  ButtonStore,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Button primitive", () => {
  it("accepts an externally owned Store without replacing it", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const presses: ButtonPressDetails[] = [];
    const store = new ButtonStore({
      onPress: (details) => presses.push(details),
    });
    const root = new ButtonRenderable(setup.renderer, { store });

    expect(root.store).toBe(store);
    expect(root.getState()).toBe(store.state);
    root.press();
    expect(presses).toEqual([{ source: "imperative" }]);
  });

  it("leaves visual assembly to the caller and exposes readonly state", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new ButtonRenderable(setup.renderer, {
      id: "button-root",
    });
    const content = new TextRenderable(setup.renderer, {
      content: "Consumer content",
      id: "button-content",
    });

    expect(root.getChildren()).toEqual([]);
    root.add(content);
    setup.renderer.root.add(root);

    expect(root.getChildren()).toEqual([content]);
    expect(root.getState()).toEqual({
      disabled: false,
      focused: false,
      pressed: false,
    });
    expect(Object.isFrozen(root.getState())).toBe(true);
  });

  it("reports one immutable press detail for imperative and keyboard activation", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const presses: ButtonPressDetails[] = [];
    const root = new ButtonRenderable(setup.renderer, {
      onPress: (details) => presses.push(details),
    });
    setup.renderer.root.add(root);

    root.press();
    expect(root.handleKeyPress({ name: "enter" } as KeyEvent)).toBe(true);
    expect(root.handleKeyPress({ name: "return" } as KeyEvent)).toBe(true);
    expect(root.handleKeyPress({ name: "space" } as KeyEvent)).toBe(true);
    expect(root.handleKeyPress({ name: "a" } as KeyEvent)).toBe(false);

    expect(presses).toEqual([
      { source: "imperative" },
      { key: "enter", source: "keyboard" },
      { key: "enter", source: "keyboard" },
      { key: "space", source: "keyboard" },
    ]);
    expect(presses.every(Object.isFrozen)).toBe(true);
  });

  it("tracks primary-pointer press state and activates only on an uncancelled release", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const presses: ButtonPressDetails[] = [];
    const active = new ButtonRenderable(setup.renderer, {
      height: 1,
      onPress: (details) => presses.push(details),
      width: 5,
    });
    const cancelled = new ButtonRenderable(setup.renderer, {
      height: 1,
      onMouseUp: (event) => event.preventDefault(),
      onPress: (details) => presses.push(details),
      width: 5,
    });
    const row = new BoxRenderable(setup.renderer, {
      flexDirection: "row",
      height: 1,
      width: 10,
    });
    row.add(active);
    row.add(cancelled);
    setup.renderer.root.add(row);
    await setup.renderOnce();

    await setup.mockMouse.pressDown(0, 0);
    expect(active.getState().pressed).toBe(true);
    await setup.mockMouse.release(0, 0);
    expect(active.getState()).toEqual({
      disabled: false,
      focused: true,
      pressed: false,
    });
    expect(presses).toEqual([{ button: 0, source: "pointer" }]);
    expect(Object.isFrozen(presses[0])).toBe(true);

    await setup.mockMouse.pressDown(5, 0);
    expect(cancelled.getState().pressed).toBe(true);
    await setup.mockMouse.release(5, 0);
    expect(cancelled.getState().pressed).toBe(false);
    expect(presses).toHaveLength(1);

    await setup.mockMouse.click(0, 0, 2);
    expect(presses).toHaveLength(1);
  });

  it("resets pressed state on disablement, blur, and teardown while disabled gates every activation seam", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const presses: ButtonPressDetails[] = [];
    const root = new ButtonRenderable(setup.renderer, {
      height: 1,
      onPress: (details) => presses.push(details),
      width: 5,
    });
    setup.renderer.root.add(root);
    await setup.renderOnce();

    root.focus();
    await setup.mockMouse.pressDown(0, 0);
    expect(root.getState()).toEqual({
      disabled: false,
      focused: true,
      pressed: true,
    });

    root.disabled = true;
    expect(root.getState()).toEqual({
      disabled: true,
      focused: false,
      pressed: false,
    });
    root.focus();
    root.press();
    expect(root.handleKeyPress({ name: "space" } as KeyEvent)).toBe(false);
    await setup.mockMouse.click(0, 0);
    expect(root.focused).toBe(false);
    expect(presses).toEqual([]);

    root.disabled = undefined;
    root.focus();
    await setup.mockMouse.pressDown(0, 0);
    root.blur();
    expect(root.getState().pressed).toBe(false);
    await setup.mockMouse.release(0, 0);
    expect(presses).toEqual([]);

    await setup.mockMouse.pressDown(0, 0);
    expect(root.getState().pressed).toBe(true);
    root.destroy();
    expect(root.getState()).toEqual({
      disabled: false,
      focused: false,
      pressed: false,
    });
    root.press();
    expect(presses).toEqual([]);
  });
});
