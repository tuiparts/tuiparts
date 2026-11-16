import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  ProgressIndicatorRenderable,
  ProgressRootRenderable,
  ProgressStore,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Progress primitive", () => {
  it("normalizes value, max, and computes percentage", async () => {
    const store = new ProgressStore({ defaultValue: 50, max: 200 });
    expect(store.state).toEqual({
      max: 200,
      percentage: 25,
      value: 50,
    });
    expect(Object.isFrozen(store.state)).toBe(true);

    // Clamps above max
    store.setValue(300);
    expect(store.state.value).toBe(200);
    expect(store.state.percentage).toBe(100);

    // Clamps below 0
    store.setValue(-10);
    expect(store.state.value).toBe(0);
    expect(store.state.percentage).toBe(0);

    // Indeterminate
    store.setValue(null);
    expect(store.state.value).toBe(null);
    expect(store.state.percentage).toBe(null);
  });

  it("updates Indicator width automatically when Store value updates", async () => {
    setup = await createTestRenderer({ width: 40, height: 3 });
    const root = new ProgressRootRenderable(setup.renderer, {
      defaultValue: 25,
      width: 40,
    });
    const indicator = new ProgressIndicatorRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(indicator);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(indicator.percentage).toBe(25);
    expect(indicator.width).toBe(10);

    root.value = 75;
    await setup.renderOnce();
    expect(root.getState().percentage).toBe(75);
    expect(indicator.percentage).toBe(75);
    expect(indicator.width).toBe(30);

    root.value = null;
    expect(root.getState().percentage).toBe(null);
    expect(indicator.percentage).toBe(null);
  });

  it("supports controlled value updates and reports changes via onValueChange", async () => {
    const changes: (number | null)[] = [];
    const store = new ProgressStore({
      onValueChange: (val) => changes.push(val),
      value: 10,
    });

    expect(store.isControlled).toBe(true);
    expect(store.state.value).toBe(10);

    store.setValue(40);
    expect(changes).toEqual([40]);
    // Controlled store doesn't self-mutate state until setControlledValue
    expect(store.state.value).toBe(10);

    store.setControlledValue(40);
    expect(store.state.value).toBe(40);
    expect(store.state.percentage).toBe(40);
  });

  it("guards against adoption by multiple live roots", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const renderer = setup.renderer;
    const store = new ProgressStore();
    const root1 = new ProgressRootRenderable(renderer, { store });

    expect(() => {
      new ProgressRootRenderable(renderer, { store });
    }).toThrow("Progress Store may be adopted by only one live Progress.Root");

    root1.destroy();
    // After destroy, can be adopted by a new root
    const root2 = new ProgressRootRenderable(renderer, { store });
    expect(root2.store).toBe(store);
  });

  it("cleans up subscriptions on remove and destroy", async () => {
    setup = await createTestRenderer({ width: 40, height: 3 });
    const root = new ProgressRootRenderable(setup.renderer, {
      defaultValue: 10,
      width: 40,
    });
    const indicator = new ProgressIndicatorRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(indicator);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(indicator.percentage).toBe(10);
    expect(indicator.width).toBe(4);

    indicator.destroy();
    root.value = 90;
    await setup.renderOnce();
    // indicator was destroyed, width should not update
    expect(indicator.width).toBe(4);
  });
});
