import { afterEach, describe, expect, it } from "bun:test";
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
  it("leaves visual assembly to the caller while sharing behavior with parts", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new CheckboxStore({ defaultChecked: false });
    const root = new CheckboxRootRenderable(setup.renderer, {
      store,
      id: "checkbox-root",
    });
    const indicator = new CheckboxIndicatorRenderable(setup.renderer, {
      store,
      id: "checkbox-indicator",
    });

    expect(root.getChildren()).toEqual([]);
    root.add(indicator);
    setup.renderer.root.add(root);

    expect(root.checked).toBe(false);
    expect(indicator.visible).toBe(false);

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

    root.press();

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

    root.focus();
    root.press();

    expect(root.focused).toBe(false);
    expect(root.checked).toBe(false);
    expect(changes).toEqual([]);

    root.disabled = undefined;
    root.press();
    expect(root.checked).toBe(true);
  });

  it("returns to uncontrolled ownership when checked is removed", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new CheckboxRootRenderable(setup.renderer, { checked: false });
    setup.renderer.root.add(root);

    root.checked = undefined;
    root.press();

    expect(root.checked).toBe(true);
  });
});
