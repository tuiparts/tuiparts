import { afterEach, describe, expect, it } from "bun:test";
import { type KeyEvent, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  NumberFieldRootRenderable,
  NumberFieldScrubAreaRenderable,
  NumberFieldStore,
} from "./index";

let setup: TestRendererSetup | undefined;

function keyEvent(
  name: string,
  modifiers: Partial<Pick<KeyEvent, "option" | "shift">> = {},
): KeyEvent {
  // SAFETY: NumberField reads only the key name and modifier fields supplied by
  // this helper; OpenTUI supplies all remaining KeyEvent fields at runtime.
  return {
    name,
    option: false,
    shift: false,
    ...modifiers,
  } as KeyEvent;
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("NumberField primitive", () => {
  it("preserves intermediate draft text and normalizes it on commit", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const changes: Array<number | null> = [];
    const commits: Array<number | null> = [];
    const root = new NumberFieldRootRenderable(setup.renderer, {
      onValueChange: (value) => changes.push(value),
      onValueCommit: (value) => commits.push(value),
    });
    const input = new NumberFieldInputRenderable(setup.renderer, {
      store: root.store,
      width: 10,
    });
    root.add(input);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    input.focus();
    input.insertText("-");
    expect(root.getState()).toMatchObject({ inputValue: "-", value: null });
    expect(changes).toEqual([]);

    input.insertText("1.5");
    expect(root.getState()).toMatchObject({ inputValue: "-1.5", value: -1.5 });
    expect(changes).toEqual([-1.5]);

    input.blur();
    expect(root.getState().inputValue).toBe("-1.5");
    expect(commits).toEqual([-1.5]);
  });

  it("rejects nonnumeric input and commits cleared input as null", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const commits: Array<number | null> = [];
    const root = new NumberFieldRootRenderable(setup.renderer, {
      defaultValue: 4,
      onValueCommit: (value) => commits.push(value),
    });
    const input = new NumberFieldInputRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(input);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    input.focus();
    input.value = "bad";
    input.insertText("e");
    input.insertText(" 5");
    expect(input.value).toBe("4");
    expect(root.getState()).toMatchObject({ inputValue: "4", value: 4 });

    input.value = "";
    expect(root.value).toBe(null);
    input.submit();
    expect(commits).toEqual([null]);
  });

  it("validates numeric configuration and repairs values when bounds change", () => {
    expect(() => new NumberFieldStore({ step: 0 })).toThrow();
    expect(() => new NumberFieldStore({ smallStep: Number.NaN })).toThrow();
    expect(() => new NumberFieldStore({ min: 2, max: 1 })).toThrow();

    const store = new NumberFieldStore({ defaultValue: 12, max: 10 });
    expect(store.state.value).toBe(10);
    store.setMin(9);
    store.setMax(9);
    expect(store.state).toMatchObject({ inputValue: "9", value: 9 });
    expect(() => store.setMin(10)).toThrow();

    const derived = new NumberFieldStore({ defaultValue: 5 });
    const before = derived.state;
    let notifications = 0;
    derived.subscribe(() => {
      notifications += 1;
    });
    derived.setMax(5);
    expect(derived.isStepDisabled(1)).toBe(true);
    expect(derived.state).not.toBe(before);
    expect(notifications).toBe(1);
  });

  it("reports controlled intent and releases control at the observed value", () => {
    const changes: Array<number | null> = [];
    const store = new NumberFieldStore({
      onValueChange: (value) => changes.push(value),
      value: 2,
    });

    store.stepByKey(keyEvent("up"));
    expect(store.state.value).toBe(2);
    expect(changes).toEqual([3]);

    store.setValue(3);
    store.setValue(undefined);
    store.stepByKey(keyEvent("up"));
    expect(store.state.value).toBe(4);
  });

  it("commits after change callbacks and serializes reentrant mutations", () => {
    const order: string[] = [];
    let store: NumberFieldStore;
    store = new NumberFieldStore({
      defaultValue: 1,
      onValueChange: (value, details) => {
        order.push(`change:${value}:${details.reason}`);
        store.setDisabled(true);
      },
      onValueCommit: (value, details) =>
        order.push(`commit:${value}:${details.reason}`),
    });

    store.stepByKey(keyEvent("up"));
    expect(order).toEqual(["change:2:keyboard", "commit:2:keyboard"]);
    expect(store.state).toMatchObject({ disabled: true, value: 2 });
  });

  it("uses precise normal, small, large, page, and bound keyboard steps", () => {
    const store = new NumberFieldStore({
      defaultValue: 0.1,
      largeStep: 10,
      max: 20,
      min: -20,
      smallStep: 0.1,
      step: 0.1,
    });

    expect(store.stepByKey(keyEvent("up"))).toBe(true);
    expect(store.state.value).toBe(0.2);
    store.stepByKey(keyEvent("up", { option: true }));
    expect(store.state.value).toBe(0.3);
    store.stepByKey(keyEvent("up", { shift: true }));
    expect(store.state.value).toBe(10.3);
    store.stepByKey(keyEvent("pagedown"));
    expect(store.state.value).toBe(0.3);
    store.stepByKey(keyEvent("end"));
    expect(store.state.value).toBe(20);
    store.stepByKey(keyEvent("home"));
    expect(store.state.value).toBe(-20);

    const tiny = new NumberFieldStore({ defaultValue: 0, step: 1e-13 });
    tiny.stepByKey(keyEvent("up"));
    expect(tiny.state).toMatchObject({
      inputValue: "0.0000000000001",
      value: 1e-13,
    });

    const smallest = new NumberFieldStore({
      defaultValue: 0,
      step: Number.MIN_VALUE,
    });
    smallest.stepByKey(keyEvent("up"));
    expect(smallest.state.value).toBe(Number.MIN_VALUE);
    expect(smallest.state.inputValue).not.toContain("e");

    const large = new NumberFieldStore({ defaultValue: 1e21 });
    expect(large.state.inputValue).toBe("1000000000000000000000");

    const overflow = new NumberFieldStore({
      defaultValue: Number.MAX_VALUE,
      step: Number.MAX_VALUE,
    });
    overflow.stepByKey(keyEvent("up"));
    expect(overflow.state.value).toBe(Number.MAX_VALUE);
  });

  it("uses absolute scrub displacement for left, right, bounded, and controlled requests", () => {
    const changes: number[] = [];
    const commits: number[] = [];
    const store = new NumberFieldStore({
      defaultValue: 5,
      max: 10,
      min: 0,
      onValueChange: (value) => {
        if (value !== null) changes.push(value);
      },
      onValueCommit: (value) => {
        if (value !== null) commits.push(value);
      },
      step: 2,
    });
    expect(store.startScrub()).toBe(true);
    store.scrub(1);
    store.scrub(3);
    store.scrub(2);
    store.scrub(-4);
    store.finishScrub();
    expect(changes).toEqual([7, 10, 9, 0]);
    expect(commits).toEqual([0]);

    const controlledChanges: number[] = [];
    const controlledCommits: number[] = [];
    const controlled = new NumberFieldStore({
      onValueChange: (value) => {
        if (value !== null) controlledChanges.push(value);
      },
      onValueCommit: (value) => {
        if (value !== null) controlledCommits.push(value);
      },
      value: 5,
    });
    controlled.startScrub();
    controlled.scrub(2);
    controlled.finishScrub();
    expect(controlled.state.value).toBe(5);
    expect(controlledChanges).toEqual([7]);
    expect(controlledCommits).toEqual([7]);
  });

  it("shares bounded requests and frozen details across step Parts", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const reasons: string[] = [];
    const root = new NumberFieldRootRenderable(setup.renderer, {
      defaultValue: 0,
      max: 1,
      min: -1,
      onValueChange: (_value, details) => {
        expect(Object.isFrozen(details)).toBe(true);
        reasons.push(details.reason);
      },
    });
    const increment = new NumberFieldIncrementRenderable(setup.renderer, {
      store: root.store,
    });
    const decrement = new NumberFieldDecrementRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(increment);
    root.add(decrement);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    increment.press();
    expect(root.value).toBe(1);
    expect(increment.getState().disabled).toBe(true);
    increment.press();
    decrement.press();
    expect(root.value).toBe(0);
    expect(reasons).toEqual(["increment", "decrement"]);
  });

  it("derives scrubbing from the press origin and commits once on release", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const changes: number[] = [];
    const commits: number[] = [];
    const root = new NumberFieldRootRenderable(setup.renderer, {
      defaultValue: 5,
      onValueChange: (value) => {
        if (value !== null) changes.push(value);
      },
      onValueCommit: (value) => {
        if (value !== null) commits.push(value);
      },
    });
    const scrub = new NumberFieldScrubAreaRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 12,
    });
    scrub.add(
      new TextRenderable(setup.renderer, {
        content: "Drag amount",
        selectable: true,
      }),
    );
    root.add(scrub);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.pressDown(scrub.x + 2, scrub.y);
    expect(setup.renderer.getSelection()).toBeNull();
    expect(root.getState().scrubbing).toBe(true);
    await setup.mockMouse.release(scrub.x + 2, scrub.y);
    expect(commits).toEqual([]);

    await setup.mockMouse.drag(scrub.x + 2, scrub.y, scrub.x + 17, scrub.y);

    expect(root.value).toBe(20);
    expect(changes.at(-1)).toBe(20);
    expect(commits).toEqual([20]);
    expect(root.getState().scrubbing).toBe(false);
    expect(setup.renderer.getSelection()).toBeNull();

    await setup.mockMouse.click(scrub.x + 2, scrub.y);
    expect(commits).toEqual([20]);

    await setup.mockMouse.drag(scrub.x + 2, scrub.y, scrub.x + 5, scrub.y, 1);
    expect(root.value).toBe(20);
    expect(commits).toEqual([20]);

    await setup.mockMouse.pressDown(scrub.x + 2, scrub.y);
    root.disabled = true;
    await setup.mockMouse.release(scrub.x + 6, scrub.y);
    expect(root.getState().scrubbing).toBe(false);
    expect(commits).toEqual([20]);
  });

  it("cancels scrubbing when ScrubArea is removed", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const commits: Array<number | null> = [];
    const root = new NumberFieldRootRenderable(setup.renderer, {
      defaultValue: 5,
      onValueCommit: (value) => commits.push(value),
    });
    const scrub = new NumberFieldScrubAreaRenderable(setup.renderer, {
      height: 1,
      store: root.store,
      width: 12,
    });
    root.add(scrub);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    await setup.mockMouse.pressDown(scrub.x + 2, scrub.y);
    root.remove(scrub);
    await setup.mockMouse.release(scrub.x + 6, scrub.y);
    expect(root.getState().scrubbing).toBe(false);
    expect(commits).toEqual([]);
  });

  it("gates focus and every mutation seam while disabled or read-only", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const root = new NumberFieldRootRenderable(setup.renderer, {
      defaultValue: 1,
      disabled: true,
    });
    const input = new NumberFieldInputRenderable(setup.renderer, {
      store: root.store,
    });
    const increment = new NumberFieldIncrementRenderable(setup.renderer, {
      store: root.store,
    });
    root.add(input);
    root.add(increment);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    input.focus();
    input.insertText("2");
    increment.press();
    expect(input.focused).toBe(false);
    expect(root.value).toBe(1);

    root.disabled = false;
    input.focus();
    input.value = ".";
    root.readOnly = true;
    input.insertText("2");
    input.submit();
    increment.press();
    expect(input.focused).toBe(true);
    expect(input.value).toBe(".");
    expect(root.value).toBe(1);

    root.readOnly = false;
    input.submit();
    expect(input.value).toBe("1");
  });

  it("ends nested descendant coordination permanently when Root is removed", async () => {
    setup = await createTestRenderer({ width: 30, height: 4 });
    const root = new NumberFieldRootRenderable(setup.renderer);
    const scrub = new NumberFieldScrubAreaRenderable(setup.renderer, {
      store: root.store,
    });
    const increment = new NumberFieldIncrementRenderable(setup.renderer, {
      store: root.store,
    });
    scrub.add(increment);
    root.add(scrub);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    setup.renderer.root.remove(root);
    increment.press();
    expect(root.value).toBe(null);

    const replacement = new NumberFieldRootRenderable(setup.renderer, {
      store: root.store,
    });
    const nextIncrement = new NumberFieldIncrementRenderable(setup.renderer, {
      store: root.store,
    });
    replacement.add(nextIncrement);
    setup.renderer.root.add(replacement);
    await setup.renderOnce();
    nextIncrement.press();
    expect(replacement.value).toBe(1);
  });
});
