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
  it("wires a press through the Root to its Store", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new CheckboxRootRenderable(setup.renderer);
    root.press();
    expect(root.checked).toBe(true);
  });

  it("adopts a Store and rejects replacement", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new CheckboxStore({ defaultChecked: true });
    const root = new CheckboxRootRenderable(setup.renderer, { store });
    expect(root.store).toBe(store);
    expect(() => {
      root.store = new CheckboxStore();
    }).toThrow("Checkbox.Root store cannot be replaced");
  });

  it("applies explicit behavior props to a supplied Store", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const store = new CheckboxStore({ defaultChecked: false });
    const root = new CheckboxRootRenderable(setup.renderer, {
      checked: true,
      disabled: true,
      onCheckedChange: (checked) => changes.push(checked),
      store,
    });
    expect(root.getState()).toEqual({
      checked: true,
      disabled: true,
      focused: false,
    });
    root.disabled = false;
    root.press();
    expect(changes).toEqual([false]);
    expect(root.checked).toBe(true);
  });

  it("syncs Indicator visibility and unsubscribes on destroy", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new CheckboxStore();
    const indicator = new CheckboxIndicatorRenderable(setup.renderer, {
      store,
    });
    store.setChecked(true);
    expect(indicator.visible).toBe(true);
    indicator.destroy();
    store.setChecked(false);
    expect(indicator.visible).toBe(true);
  });
});
