import { afterEach, describe, expect, it } from "bun:test";
import { type KeyEvent, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  type SliderChangeDetails,
  SliderRangeRenderable,
  SliderRootRenderable,
  SliderStore,
  SliderThumbRenderable,
  SliderTrackRenderable,
} from "./primitive";

let setup: TestRendererSetup | undefined;

function keyEvent(
  name: string,
  modifiers: Partial<
    Pick<KeyEvent, "ctrl" | "hyper" | "meta" | "option" | "shift" | "super">
  > = {},
): KeyEvent {
  // SAFETY: Slider reads only the key name and modifier/default-prevention
  // fields supplied here; OpenTUI supplies the remaining fields at runtime.
  return {
    ctrl: false,
    defaultPrevented: false,
    hyper: false,
    meta: false,
    name,
    option: false,
    shift: false,
    super: false,
    ...modifiers,
  } as KeyEvent;
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Slider primitive", () => {
  it("owns an uncontrolled value and applies orientation keyboard steps", () => {
    const changes: number[] = [];
    const commits: number[] = [];
    const store = new SliderStore({
      defaultValue: 0.1,
      max: 1,
      min: -1,
      onValueChange: (value) => changes.push(value),
      onValueCommit: (value) => commits.push(value),
      step: 0.1,
    });

    expect(store.stepByKey(keyEvent("right"))).toBe(true);
    expect(store.state.value).toBe(0.2);
    expect(changes).toEqual([0.2]);
    expect(commits).toEqual([0.2]);
    expect(store.stepByKey(keyEvent("up"))).toBe(false);
  });

  it("reports controlled intent and releases control at the observed value", () => {
    const changes: number[] = [];
    const store = new SliderStore({
      onValueChange: (value) => changes.push(value),
      value: 2,
    });

    store.stepByKey(keyEvent("right"));
    expect(store.state.value).toBe(2);
    expect(changes).toEqual([3]);

    store.setValue(3);
    store.setValue(undefined);
    store.stepByKey(keyEvent("right"));
    expect(store.state.value).toBe(4);
  });

  it("commits after value-change callbacks that mutate Slider state", () => {
    const order: string[] = [];
    let store: SliderStore;
    store = new SliderStore({
      defaultValue: 1,
      onValueChange: (value, details) => {
        order.push(`change:${value}:${details.reason}`);
        store.setDisabled(true);
      },
      onValueCommit: (value, details) =>
        order.push(`commit:${value}:${details.reason}`),
    });

    expect(store.stepByKey(keyEvent("right"))).toBe(true);
    expect(order).toEqual(["change:2:step", "commit:2:step"]);
    expect(store.state).toMatchObject({ disabled: true, value: 2 });
  });

  it("deduplicates stepped pointer requests and commits the final controlled intent once", () => {
    const changes: number[] = [];
    const commits: number[] = [];
    const store = new SliderStore({
      max: 1,
      min: -1,
      onValueChange: (value) => changes.push(value),
      onValueCommit: (value) => commits.push(value),
      step: 0.25,
      value: -0.5,
    });

    expect(store.startPointer()).toBe(true);
    store.requestPointerRatio(0.74);
    store.requestPointerRatio(0.75);
    store.markPointerDragging();
    store.requestPointerRatio(0.88);
    store.finishPointer();

    expect(store.state).toMatchObject({ dragging: false, value: -0.5 });
    expect(changes).toEqual([0.5, 0.75]);
    expect(commits).toEqual([0.75]);
  });

  it("validates configuration, repairs bounds, and freezes stable snapshots", () => {
    expect(() => new SliderStore({ min: 2, max: 1 })).toThrow();
    expect(() => new SliderStore({ step: 0 })).toThrow();
    expect(() => new SliderStore({ value: Number.NaN })).toThrow();

    const store = new SliderStore({ defaultValue: 0.9, max: 1, min: 0 });
    const before = store.state;
    expect(Object.isFrozen(before)).toBe(true);
    store.setStep(1);
    expect(store.state).toBe(before);
    store.setBounds(-0.5, 0.5);
    expect(store.state.value).toBe(0.5);
    expect(store.state).not.toBe(before);
  });

  it("uses native Track presses and captured dragging through custom Parts", async () => {
    setup = await createTestRenderer({ width: 50, height: 5 });
    const changes: number[] = [];
    const commits: number[] = [];
    const root = new SliderRootRenderable(setup.renderer, {
      defaultValue: -0.5,
      max: 1,
      min: -1,
      onValueChange: (value) => changes.push(value),
      onValueCommit: (value) => commits.push(value),
      step: 0.25,
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 32,
    });
    const range = new SliderRangeRenderable(setup.renderer, {
      store: root.store,
    });
    const thumb = new SliderThumbRenderable(setup.renderer, {
      store: root.store,
    });
    track.add(
      new TextRenderable(setup.renderer, {
        content: "─".repeat(32),
        selectable: true,
      }),
    );
    track.add(range);
    track.add(thumb);
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.click(track.x + 24, track.y);
    expect(root.value).toBe(0.5);
    expect(changes).toEqual([0.5]);
    expect(commits).toEqual([0.5]);
    expect(track.focused).toBe(true);
    expect(setup.renderer.getSelection()).toBeNull();

    await setup.mockMouse.drag(track.x + 24, track.y, track.x + 8, track.y);
    expect(root.value).toBe(-0.5);
    expect(changes.at(-1)).toBe(-0.5);
    expect(commits.at(-1)).toBe(-0.5);
    expect(root.getState().dragging).toBe(false);
  });

  it("keeps native Slider painting transparent when Track has no visual children", async () => {
    setup = await createTestRenderer({ width: 20, height: 3 });
    const root = new SliderRootRenderable(setup.renderer, {
      defaultValue: 50,
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 12,
    });
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(setup.captureCharFrame()).not.toContain("█");
    expect(setup.captureCharFrame()).not.toContain("▌");
    expect(setup.captureCharFrame()).not.toContain("▐");
  });

  it("keeps controlled Track visuals authoritative through click and drag release", async () => {
    setup = await createTestRenderer({ width: 50, height: 4 });
    const changes: number[] = [];
    const commits: number[] = [];
    const root = new SliderRootRenderable(setup.renderer, {
      max: 1,
      min: -1,
      onValueChange: (value) => changes.push(value),
      onValueCommit: (value) => commits.push(value),
      step: 0.25,
      value: -0.5,
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 32,
    });
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.click(track.x + 24, track.y);
    expect(root.value).toBe(-0.5);
    expect(track.value).toBe(25);
    expect(changes).toEqual([0.5]);
    expect(commits).toEqual([0.5]);

    await setup.mockMouse.drag(track.x + 8, track.y, track.x + 28, track.y);
    expect(root.value).toBe(-0.5);
    expect(track.value).toBe(25);
    expect(changes.at(-1)).toBe(0.75);
    expect(commits.at(-1)).toBe(0.75);
  });

  it("gates native pointer behavior while disabled, read-only, non-primary, or prevented", async () => {
    setup = await createTestRenderer({ width: 40, height: 4 });
    const changes: number[] = [];
    const root = new SliderRootRenderable(setup.renderer, {
      defaultValue: 0,
      disabled: true,
      onValueChange: (value) => changes.push(value),
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 20,
    });
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.click(track.x + 15, track.y);
    expect(track.focused).toBe(false);
    expect(root.value).toBe(0);

    root.disabled = false;
    root.readOnly = true;
    track.focus();
    await setup.mockMouse.click(track.x + 15, track.y);
    await setup.mockMouse.click(track.x + 15, track.y, 1);
    expect(track.focused).toBe(true);
    expect(root.value).toBe(0);

    root.readOnly = false;
    const blocker = new TextRenderable(setup.renderer, {
      content: "x".repeat(20),
      onMouseDown: (event) => event.preventDefault(),
    });
    track.add(blocker);
    await setup.renderOnce();
    await setup.mockMouse.click(track.x + 15, track.y);
    expect(root.value).toBe(0);
    expect(changes).toEqual([]);
  });

  it("updates retained Track orientation and claims only the matching key axis", async () => {
    setup = await createTestRenderer({ width: 20, height: 15 });
    const root = new SliderRootRenderable(setup.renderer, {
      defaultValue: 0,
      max: 10,
      orientation: "horizontal",
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 10,
      store: root.store,
      width: 1,
    });
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(track.handleKeyPress(keyEvent("up"))).toBe(false);
    root.orientation = "vertical";
    expect(track.orientation).toBe("vertical");
    expect(track.handleKeyPress(keyEvent("up"))).toBe(true);
    expect(root.value).toBe(1);

    await setup.mockMouse.click(track.x, track.y + 8);
    expect(root.value).toBeLessThan(5);
  });

  it("publishes frozen semantic details and ignores modifier chords", () => {
    const details: SliderChangeDetails[] = [];
    const store = new SliderStore({
      defaultValue: 0.1,
      onValueChange: (_value, next) => {
        expect(Object.isFrozen(next)).toBe(true);
        details.push(next);
      },
      step: 0.1,
    });

    expect(store.stepByKey(keyEvent("right", { ctrl: true }))).toBe(false);
    expect(store.state.value).toBe(0.1);
    expect(store.stepByKey(keyEvent("right"))).toBe(true);
    expect(store.state.value).toBe(0.2);
    expect(details).toEqual([
      { key: "right", reason: "step", source: "keyboard" },
    ]);
  });

  it("cancels an active native drag when Slider becomes disabled", async () => {
    setup = await createTestRenderer({ width: 40, height: 4 });
    const commits: number[] = [];
    const root = new SliderRootRenderable(setup.renderer, {
      defaultValue: 0,
      onValueCommit: (value) => commits.push(value),
    });
    const track = new SliderTrackRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 20,
    });
    root.add(track);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.pressDown(track.x + 2, track.y);
    await setup.mockMouse.emitMouseEvent("drag", track.x + 12, track.y);
    expect(root.getState().dragging).toBe(true);
    root.disabled = true;
    expect(track.focused).toBe(false);
    await setup.mockMouse.release(track.x + 12, track.y);

    expect(root.getState()).toMatchObject({ disabled: true, dragging: false });
    expect(commits).toEqual([]);
    expect(track.focused).toBe(false);
  });

  it("enforces one live Part of each kind and permanently ends descendant coordination", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const root = new SliderRootRenderable(setup.renderer);
    const track = new SliderTrackRenderable(setup.renderer, {
      store: root.store,
    });
    const range = new SliderRangeRenderable(setup.renderer, {
      store: root.store,
    });
    const thumb = new SliderThumbRenderable(setup.renderer, {
      store: root.store,
    });
    track.add(range);
    range.add(thumb);
    root.add(track);
    expect(
      () =>
        new SliderTrackRenderable(setup?.renderer ?? track.ctx, {
          store: root.store,
        }),
    ).toThrow();
    setup.renderer.root.add(root);
    await setup.renderOnce();

    setup.renderer.root.remove(root);
    track.focus();
    track.handleKeyPress(keyEvent("right"));
    expect(track.focused).toBe(false);
    expect(root.value).toBe(0);

    const replacement = new SliderRootRenderable(setup.renderer, {
      store: root.store,
    });
    const nextTrack = new SliderTrackRenderable(setup.renderer, {
      store: root.store,
    });
    replacement.add(nextTrack);
    setup.renderer.root.add(replacement);
    await setup.renderOnce();
    nextTrack.focus();
    nextTrack.handleKeyPress(keyEvent("right"));
    expect(replacement.value).toBe(1);
  });
});
