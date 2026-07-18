import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  SwitchRootRenderable,
  SwitchStore,
  SwitchThumbRenderable,
} from "./primitive";

let setup: TestRendererSetup | undefined;
afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Switch primitive", () => {
  it("wires a press through the Root to its Store", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new SwitchRootRenderable(setup.renderer);
    root.press();
    expect(root.checked).toBe(true);
  });

  it("adopts a Store and rejects replacement", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new SwitchStore({ defaultChecked: true });
    const root = new SwitchRootRenderable(setup.renderer, { store });
    expect(root.store).toBe(store);
    expect(() => {
      root.store = new SwitchStore();
    }).toThrow("Switch.Root store cannot be replaced");
  });

  it("applies explicit behavior props to a supplied Store", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const store = new SwitchStore({ defaultChecked: false });
    const root = new SwitchRootRenderable(setup.renderer, {
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

  it("requests renders from Store changes and unsubscribes on destroy", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new SwitchStore();
    const thumb = new SwitchThumbRenderable(setup.renderer, { store });
    let renders = 0;
    thumb.requestRender = () => renders++;
    store.setChecked(true);
    expect(renders).toBe(1);
    thumb.destroy();
    store.setChecked(false);
    expect(renders).toBe(1);
  });
});
