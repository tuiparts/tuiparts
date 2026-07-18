import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  PressableRenderable,
  type PressableStore,
  type PressDetails,
} from "./pressable";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

class FakeStore implements PressableStore {
  focusedCalls: boolean[] = [];
  private disabled = false;
  private readonly listeners = new Set<() => void>();

  get state(): { readonly disabled: boolean } {
    return { disabled: this.disabled };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setFocused(focused: boolean): void {
    this.focusedCalls.push(focused);
  }

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
    for (const listener of [...this.listeners]) listener();
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

class FakePressable extends PressableRenderable {
  readonly presses: PressDetails[] = [];
  readonly unclaimedKeys: string[] = [];
  readonly pointerChanges: boolean[] = [];

  protected handlePress(details: PressDetails): void {
    this.presses.push(details);
  }

  protected override handleUnclaimedKey(key: KeyEvent): boolean {
    if (key.name === "left") {
      this.unclaimedKeys.push(key.name);
      return true;
    }
    return false;
  }

  protected override onPointerPressedChanged(pressed: boolean): void {
    this.pointerChanges.push(pressed);
  }

  adopt(store: PressableStore): void {
    this.attachPressable(store);
  }
}

async function createPressable(store?: PressableStore): Promise<{
  setup: TestRendererSetup;
  pressable: FakePressable;
}> {
  const rendererSetup = await createTestRenderer({ width: 20, height: 5 });
  setup = rendererSetup;
  const pressable = new FakePressable(rendererSetup.renderer, {
    width: 10,
    height: 1,
  });
  if (store) pressable.adopt(store);
  rendererSetup.renderer.root.add(pressable);
  await rendererSetup.renderOnce();
  return { setup: rendererSetup, pressable };
}

function keyEvent(name: string, extra: Partial<KeyEvent> = {}): KeyEvent {
  return { name, ...extra } as KeyEvent;
}

describe("PressableRenderable", () => {
  it("presses once for each activation seam with matching details", async () => {
    const { setup, pressable } = await createPressable(new FakeStore());

    pressable.press();
    expect(pressable.handleKeyPress(keyEvent("space"))).toBe(true);
    expect(pressable.handleKeyPress(keyEvent("return"))).toBe(true);
    expect(pressable.handleKeyPress(keyEvent("enter"))).toBe(true);
    await setup.mockMouse.click(0, 0);

    expect(pressable.presses).toEqual([
      { source: "imperative" },
      { key: "space", source: "keyboard" },
      { key: "enter", source: "keyboard" },
      { key: "enter", source: "keyboard" },
      { button: 0, source: "pointer" },
    ]);
    for (const details of pressable.presses)
      expect(Object.isFrozen(details)).toBe(true);
    expect(pressable.focused).toBe(true);
  });

  it("ignores cancelled and modified activation keys", async () => {
    const { pressable } = await createPressable(new FakeStore());

    expect(
      pressable.handleKeyPress(keyEvent("space", { defaultPrevented: true })),
    ).toBe(false);
    for (const modifier of [
      "ctrl",
      "meta",
      "shift",
      "option",
      "super",
      "hyper",
    ] as const) {
      expect(
        pressable.handleKeyPress(keyEvent("space", { [modifier]: true })),
      ).toBe(false);
      expect(
        pressable.handleKeyPress(keyEvent("enter", { [modifier]: true })),
      ).toBe(false);
    }

    expect(pressable.presses).toEqual([]);
  });

  it("offers only unhandled unmodified keys to the subclass", async () => {
    const { pressable } = await createPressable(new FakeStore());

    expect(pressable.handleKeyPress(keyEvent("left"))).toBe(true);
    expect(pressable.handleKeyPress(keyEvent("right"))).toBe(false);
    expect(pressable.handleKeyPress(keyEvent("left", { ctrl: true }))).toBe(
      false,
    );

    expect(pressable.unclaimedKeys).toEqual(["left"]);
  });

  it("activates a pointer press only when it starts and ends on the node", async () => {
    const { setup, pressable } = await createPressable(new FakeStore());

    await setup.mockMouse.release(0, 0);
    expect(pressable.presses).toEqual([]);

    await setup.mockMouse.click(0, 0, 2);
    expect(pressable.presses).toEqual([]);

    await setup.mockMouse.pressDown(0, 0);
    expect(pressable.pointerChanges).toEqual([true]);
    await setup.mockMouse.release(0, 0);
    expect(pressable.pointerChanges).toEqual([true, false]);
    expect(pressable.presses).toEqual([{ button: 0, source: "pointer" }]);

    // A press that starts on the node but releases elsewhere never lands.
    await setup.mockMouse.pressDown(0, 0);
    await setup.mockMouse.release(15, 3);
    expect(pressable.presses).toEqual([{ button: 0, source: "pointer" }]);
  });

  it("honors consumer cancellation of the pointer release", async () => {
    const store = new FakeStore();
    const rendererSetup = await createTestRenderer({ width: 20, height: 5 });
    setup = rendererSetup;
    const pressable = new FakePressable(rendererSetup.renderer, {
      width: 10,
      height: 1,
      onMouseUp: (event) => event.preventDefault(),
    });
    pressable.adopt(store);
    rendererSetup.renderer.root.add(pressable);
    await rendererSetup.renderOnce();

    await rendererSetup.mockMouse.click(0, 0);

    expect(pressable.presses).toEqual([]);
  });

  it("gates every activation seam while disabled and blurs on disablement", async () => {
    const store = new FakeStore();
    const { setup, pressable } = await createPressable(store);

    pressable.focus();
    expect(pressable.focused).toBe(true);

    store.setDisabled(true);
    expect(pressable.focused).toBe(false);
    expect(pressable.focusable).toBe(false);

    pressable.focus();
    expect(pressable.handleKeyPress(keyEvent("space"))).toBe(false);
    await setup.mockMouse.click(0, 0);
    expect(pressable.focused).toBe(false);
    expect(pressable.presses).toEqual([]);

    store.setDisabled(false);
    expect(pressable.focusable).toBe(true);
    expect(pressable.handleKeyPress(keyEvent("space"))).toBe(true);
    expect(pressable.presses).toEqual([{ key: "space", source: "keyboard" }]);
  });

  it("gates the imperative press through the subclass, not the base", async () => {
    const store = new FakeStore();
    const { pressable } = await createPressable(store);
    store.setDisabled(true);

    pressable.press();

    // The base forwards; disabled imperative gating belongs to the Store.
    expect(pressable.presses).toEqual([{ source: "imperative" }]);
  });

  it("mirrors focus and blur into the store", async () => {
    const store = new FakeStore();
    const { pressable } = await createPressable(store);

    pressable.focus();
    pressable.blur();

    expect(store.focusedCalls).toEqual([true, false]);
  });

  it("stays permanently enabled without an attached store", async () => {
    const { pressable } = await createPressable();

    expect(pressable.focusable).toBe(true);
    expect(pressable.handleKeyPress(keyEvent("space"))).toBe(true);
    expect(pressable.presses).toEqual([{ key: "space", source: "keyboard" }]);
  });

  it("rejects a second store", async () => {
    const { pressable } = await createPressable(new FakeStore());

    expect(() => pressable.adopt(new FakeStore())).toThrow(
      "Pressable store is already attached",
    );
  });

  it("releases the store and goes inert on destroy", async () => {
    const store = new FakeStore();
    const { pressable } = await createPressable(store);
    expect(store.listenerCount).toBe(1);

    pressable.destroy();

    expect(store.listenerCount).toBe(0);
    expect(store.focusedCalls).toEqual([false]);
    pressable.press();
    expect(pressable.handleKeyPress(keyEvent("space"))).toBe(false);
    expect(pressable.presses).toEqual([]);
  });
});
