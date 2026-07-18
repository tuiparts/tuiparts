import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, type KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  type RadioGroupChangeDetails,
  RadioGroupRenderable,
  RadioGroupStore,
  RadioIndicatorRenderable,
  RadioRootRenderable,
} from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("RadioGroup Core parts", () => {
  it("keeps a Radio inert without matching RadioGroup ownership", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: string[] = [];
    const store = new RadioGroupStore({
      onValueChange: (value) => changes.push(value),
    });
    const radio = new RadioRootRenderable(setup.renderer, {
      store,
      value: "orphan",
    });
    setup.renderer.root.add(radio);
    await setup.renderOnce();

    radio.focus();
    radio.press();

    expect(radio.getState()).toMatchObject({
      available: false,
      checked: false,
      focused: false,
    });
    expect(changes).toEqual([]);
  });

  it("leaves visual assembly to the caller while coordinating Item selection", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRenderable(setup.renderer, {
      defaultValue: "alpha",
    });
    const alpha = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      id: "alpha",
    });
    const beta = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
      id: "beta",
    });
    const betaIndicator = new RadioIndicatorRenderable(setup.renderer, {
      radio: beta,
      id: "beta-indicator",
    });
    beta.add(betaIndicator);
    root.add(alpha);
    root.add(beta);
    setup.renderer.root.add(root);

    expect(alpha.getChildren()).toEqual([]);
    expect(alpha.getState().checked).toBe(true);
    expect(betaIndicator.visible).toBe(false);

    beta.press();

    expect(root.getState().value).toBe("beta");
    expect(alpha.getState().checked).toBe(false);
    expect(beta.getState().checked).toBe(true);
    expect(betaIndicator.visible).toBe(true);

    beta.destroy();
    expect(betaIndicator.visible).toBe(false);
    expect(betaIndicator.getState().checked).toBe(false);
    betaIndicator.destroy();
  });

  it("reports controlled activation details without mutating parent state", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: Array<{ value: string; source: string }> = [];
    const root = new RadioGroupRenderable(setup.renderer, {
      value: "alpha",
      onValueChange: (value, details) =>
        changes.push({ value, source: details.source }),
    });
    const beta = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
    });
    root.add(beta);
    setup.renderer.root.add(root);

    expect(beta.handleKeyPress({ name: "space" } as KeyEvent)).toBe(true);
    expect(changes).toEqual([{ value: "beta", source: "keyboard" }]);
    expect(root.value).toBe("alpha");

    root.value = "beta";
    expect(beta.checked).toBe(true);
  });

  it("suppresses disabled focus and activation at Item and Root levels", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: string[] = [];
    const root = new RadioGroupRenderable(setup.renderer, {
      onValueChange: (value) => changes.push(value),
    });
    const item = new RadioRootRenderable(setup.renderer, {
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
    expect(focusedStates.slice(-2)).toEqual([true, false]);
    item.press();
    expect(root.value).toBeNull();
  });

  it("updates retained Item props and unregisters on destruction", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRenderable(setup.renderer);
    const item = new RadioRootRenderable(setup.renderer, {
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

  // The shared activation matrix (guards, pointer model, disabled sync) is
  // proven once in internal/pressable.test.ts; this is the wiring round-trip.
  it("selects from a primary-button click with pointer-sourced details", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const details: RadioGroupChangeDetails[] = [];
    const root = new RadioGroupRenderable(setup.renderer, {
      flexDirection: "row",
      onValueChange: (_value, changeDetails) => details.push(changeDetails),
    });
    const item = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      width: 5,
      height: 1,
    });
    root.add(item);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.click(0, 0);

    expect(root.value).toBe("alpha");
    expect(item.focused).toBe(true);
    expect(details).toEqual([{ reason: "activation", source: "pointer" }]);
  });

  it("moves roving focus, skips disabled Items, wraps, and handles Home/End", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: Array<{ value: string; reason: string }> = [];
    const root = new RadioGroupRenderable(setup.renderer, {
      defaultValue: "alpha",
      flexDirection: "column",
      onValueChange: (value, details) =>
        changes.push({ value, reason: details.reason }),
    });
    const alpha = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      width: 5,
      height: 1,
    });
    const beta = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
      disabled: true,
      width: 5,
      height: 1,
    });
    const gamma = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "gamma",
      width: 5,
      height: 1,
    });
    root.add(alpha);
    root.add(beta);
    root.add(gamma);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(alpha.focusable).toBe(true);
    expect(beta.focusable).toBe(false);
    expect(gamma.focusable).toBe(false);
    alpha.focus();

    await setup.mockInput.pressArrow("down");
    expect(gamma.focused).toBe(true);
    expect(gamma.checked).toBe(true);
    expect(changes).toEqual([{ value: "gamma", reason: "navigation" }]);

    await setup.mockInput.pressArrow("right");
    expect(alpha.focused).toBe(true);
    expect(alpha.checked).toBe(true);

    await setup.mockInput.pressKey("END");
    expect(gamma.focused).toBe(true);
    await setup.mockInput.pressKey("HOME");
    expect(alpha.focused).toBe(true);
    expect(changes.map((change) => change.value)).toEqual([
      "gamma",
      "alpha",
      "gamma",
      "alpha",
    ]);

    alpha.disabled = true;
    expect(gamma.focused).toBe(true);
    expect(root.value).toBe("alpha");

    alpha.disabled = false;
    gamma.destroy();
    expect(alpha.focused).toBe(true);
    expect(root.value).toBe("alpha");
  });

  it("moves controlled focus while leaving selection parent-owned", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: Array<{ value: string; reason: string }> = [];
    const root = new RadioGroupRenderable(setup.renderer, {
      value: "alpha",
      onValueChange: (value, details) =>
        changes.push({ value, reason: details.reason }),
    });
    const alpha = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      width: 5,
      height: 1,
    });
    const beta = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
      width: 5,
      height: 1,
    });
    root.add(alpha);
    root.add(beta);
    setup.renderer.root.add(root);
    alpha.focus();

    await setup.mockInput.pressArrow("down");

    expect(beta.focused).toBe(true);
    expect(root.value).toBe("alpha");
    expect(changes).toEqual([{ value: "beta", reason: "navigation" }]);
    expect(beta.handleKeyPress({ name: "down", ctrl: true } as KeyEvent)).toBe(
      false,
    );
  });

  it("uses current nested render order and excludes hidden Items", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const root = new RadioGroupRenderable(setup.renderer);
    const wrapper = new BoxRenderable(setup.renderer, {});
    const alpha = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "alpha",
      width: 5,
      height: 1,
    });
    const beta = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "beta",
      width: 5,
      height: 1,
    });
    const gamma = new RadioRootRenderable(setup.renderer, {
      store: root.store,
      value: "gamma",
      width: 5,
      height: 1,
    });
    wrapper.add(gamma);
    wrapper.add(beta);
    root.add(wrapper);
    root.add(alpha);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(gamma.focusable).toBe(true);
    expect(alpha.focusable).toBe(false);
    alpha.focus();

    await setup.mockInput.pressArrow("down");
    expect(gamma.focused).toBe(true);

    gamma.visible = false;
    expect(gamma.focused).toBe(false);
    expect(gamma.focusable).toBe(false);
    expect(beta.focused).toBe(true);
    expect(beta.focusable).toBe(true);

    alpha.focus();
    await setup.mockInput.pressArrow("down");
    expect(beta.focused).toBe(true);

    wrapper.remove(beta);
    await setup.renderOnce();
    expect(beta.focused).toBe(false);
    expect(beta.focusable).toBe(false);
    expect(alpha.focused).toBe(true);
    expect(root.value).toBe("beta");

    root.value = "alpha";
    beta.press();
    expect(root.value).toBe("alpha");

    root.visible = false;
    expect(alpha.focused).toBe(false);
    expect(alpha.focusable).toBe(false);

    root.visible = true;
    await setup.renderOnce();
    alpha.focus();
    setup.renderer.root.remove(root);
    expect(alpha.focused).toBe(false);
  });
});
