import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  RadioGroupIndicatorRenderable,
  RadioGroupItemRenderable,
  RadioGroupRootRenderable,
} from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("RadioGroup Core parts", () => {
  it("leaves visual assembly to the caller while coordinating Item selection", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRootRenderable(setup.renderer, {
      defaultValue: "alpha",
    });
    const alpha = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      id: "alpha",
    });
    const beta = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
      id: "beta",
    });
    const betaIndicator = new RadioGroupIndicatorRenderable(setup.renderer, {
      item: beta,
      id: "beta-indicator",
    });
    beta.add(betaIndicator);
    root.add(alpha);
    root.add(beta);
    setup.renderer.root.add(root);

    expect(alpha.getChildren()).toEqual([]);
    expect(alpha.getState().selected).toBe(true);
    expect(betaIndicator.visible).toBe(false);

    beta.press();

    expect(root.getState().value).toBe("beta");
    expect(alpha.getState().selected).toBe(false);
    expect(beta.getState().selected).toBe(true);
    expect(betaIndicator.visible).toBe(true);

    beta.destroy();
    expect(betaIndicator.visible).toBe(false);
    expect(betaIndicator.getState().selected).toBe(false);
    betaIndicator.destroy();
  });

  it("reports controlled activation details without mutating parent state", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: Array<{ value: string; source: string }> = [];
    const root = new RadioGroupRootRenderable(setup.renderer, {
      value: "alpha",
      onValueChange: (value, details) =>
        changes.push({ value, source: details.source }),
    });
    const beta = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
    });
    root.add(beta);
    setup.renderer.root.add(root);

    expect(beta.handleKeyPress({ name: "space" } as KeyEvent)).toBe(true);
    expect(changes).toEqual([{ value: "beta", source: "keyboard" }]);
    expect(root.value).toBe("alpha");

    root.value = "beta";
    expect(beta.selected).toBe(true);
  });

  it("suppresses disabled focus and activation at Item and Root levels", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: string[] = [];
    const root = new RadioGroupRootRenderable(setup.renderer, {
      onValueChange: (value) => changes.push(value),
    });
    const item = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "disabled",
      disabled: true,
    });
    root.add(item);
    setup.renderer.root.add(root);
    const focusedStates: boolean[] = [];
    item.subscribe((state) => focusedStates.push(state.focused));

    item.focus();
    item.press();
    expect(item.focused).toBe(false);
    expect(root.value).toBeNull();
    expect(changes).toEqual([]);

    item.disabled = false;
    focusedStates.length = 0;
    item.focus();
    expect(item.focused).toBe(true);

    root.disabled = true;
    expect(item.focused).toBe(false);
    expect(focusedStates).toEqual([true, false]);
    item.press();
    expect(root.value).toBeNull();
  });

  it("updates retained Item props and unregisters on destruction", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRootRenderable(setup.renderer);
    const item = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "before",
    });
    root.add(item);
    setup.renderer.root.add(root);
    const key = item.key;

    item.value = "after";
    expect(item.key).toBe(key);
    expect(item.getState().value).toBe("after");

    item.destroy();
    expect(root.store.getItemState(key)).toBeUndefined();
  });

  it("activates only uncancelled primary-button releases", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRootRenderable(setup.renderer, {
      flexDirection: "row",
    });
    const secondary = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "secondary",
      width: 5,
      height: 1,
    });
    const cancelled = new RadioGroupItemRenderable(setup.renderer, {
      store: root.store,
      value: "cancelled",
      width: 5,
      height: 1,
      onMouseUp: (event) => event.preventDefault(),
    });
    root.add(secondary);
    root.add(cancelled);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.click(0, 0, 2);
    expect(root.value).toBeNull();

    await setup.mockMouse.click(5, 0);
    expect(root.value).toBeNull();

    await setup.mockMouse.click(0, 0);
    expect(root.value).toBe("secondary");
  });
});
