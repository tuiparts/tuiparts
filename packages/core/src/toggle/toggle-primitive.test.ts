import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import type { ToggleChangeDetails } from "./index";
import { ToggleRenderable, ToggleStore } from "./index";

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

describe("Toggle primitive", () => {
  it("owns standalone uncontrolled state and reports every activation source", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const changes: Array<{ pressed: boolean; details: ToggleChangeDetails }> =
      [];
    const toggle = new ToggleRenderable(setup.renderer, {
      height: 1,
      onPressedChange: (pressed, details) => changes.push({ pressed, details }),
      width: 5,
    });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();

    toggle.press();
    expect(toggle.pressed).toBe(true);
    expect(toggle.handleKeyPress(keyEvent("space"))).toBe(true);
    expect(toggle.pressed).toBe(false);
    await setup.mockMouse.click(0, 0);

    expect(toggle.pressed).toBe(true);
    expect(changes).toEqual([
      { pressed: true, details: { source: "imperative" } },
      { pressed: false, details: { key: "space", source: "keyboard" } },
      { pressed: true, details: { button: 0, source: "pointer" } },
    ]);
    expect(changes.every(({ details }) => Object.isFrozen(details))).toBe(true);
  });

  it("commits uncontrolled state before notifying its owner", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    let observedPressed: boolean | undefined;
    let toggle: ToggleRenderable;
    toggle = new ToggleRenderable(setup.renderer, {
      onPressedChange: () => {
        observedPressed = toggle.pressed;
      },
    });

    toggle.press();

    expect(observedPressed).toBe(true);
  });

  it("uses committed state for reentrant uncontrolled activation", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const changes: boolean[] = [];
    let toggle: ToggleRenderable;
    toggle = new ToggleRenderable(setup.renderer, {
      onPressedChange: (pressed) => {
        changes.push(pressed);
        if (pressed) toggle.press();
      },
    });

    toggle.press();

    expect(changes).toEqual([true, false]);
    expect(toggle.pressed).toBe(false);
  });

  it("reports controlled intent without committing it and releases control", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const requests: boolean[] = [];
    const store = new ToggleStore({
      pressed: true,
      onPressedChange: (pressed) => requests.push(pressed),
    });
    const toggle = new ToggleRenderable(setup.renderer, { store });

    toggle.press();
    expect(requests).toEqual([false]);
    expect(toggle.pressed).toBe(true);
    toggle.pressed = false;
    expect(toggle.pressed).toBe(false);
    toggle.pressed = undefined;
    toggle.press();
    expect(toggle.pressed).toBe(true);
  });

  it("gates focus and activation while disabled", async () => {
    setup = await createTestRenderer({ width: 20, height: 4 });
    const requests: boolean[] = [];
    const toggle = new ToggleRenderable(setup.renderer, {
      disabled: true,
      onPressedChange: (pressed) => requests.push(pressed),
    });
    setup.renderer.root.add(toggle);

    toggle.focus();
    toggle.press();
    expect(toggle.focusable).toBe(false);
    expect(toggle.focused).toBe(false);
    expect(toggle.handleKeyPress(keyEvent("enter"))).toBe(false);
    expect(requests).toEqual([]);

    toggle.disabled = undefined;
    toggle.focus();
    expect(toggle.focused).toBe(true);
  });
});
