import { describe, expect, it } from "bun:test";
import { CheckedStore } from "./checked-store";

describe("CheckedStore", () => {
  it("toggles uncontrolled state and invokes the callback", () => {
    const changes: boolean[] = [];
    const store = new CheckedStore({
      defaultChecked: false,
      onCheckedChange: (checked) => changes.push(checked),
    });

    store.requestToggle();

    expect(store.state.checked).toBe(true);
    expect(changes).toEqual([true]);
  });

  it("reports controlled intent without committing it", () => {
    const changes: boolean[] = [];
    const store = new CheckedStore({
      checked: false,
      onCheckedChange: (checked) => changes.push(checked),
    });

    store.requestToggle();

    expect(store.state.checked).toBe(false);
    expect(changes).toEqual([true]);
  });

  it("releases control when checked is null or undefined", () => {
    const store = new CheckedStore({ checked: false });

    store.setChecked(null);
    store.requestToggle();
    expect(store.state.checked).toBe(true);

    store.setChecked(true);
    store.setChecked(undefined);
    store.requestToggle();
    expect(store.state.checked).toBe(false);
  });

  it("gates toggles while disabled", () => {
    const changes: boolean[] = [];
    const store = new CheckedStore({
      disabled: true,
      onCheckedChange: (checked) => changes.push(checked),
    });

    store.requestToggle();

    expect(store.state.checked).toBe(false);
    expect(changes).toEqual([]);
  });

  it("clears focus when disabled and refuses focus while disabled", () => {
    const store = new CheckedStore();
    store.setFocused(true);
    store.setDisabled(true);

    expect(store.state.focused).toBe(false);
    store.setFocused(true);
    expect(store.state.focused).toBe(false);
  });

  it("publishes frozen snapshots through the state accessor", () => {
    const store = new CheckedStore();
    const snapshot = store.state;

    expect(store.state).toBe(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true);
    store.setChecked(true);
    expect(store.state).not.toBe(snapshot);
    expect(Object.isFrozen(store.state)).toBe(true);
  });

  it("notifies only when state changes", () => {
    const states: unknown[] = [];
    const store = new CheckedStore();
    store.subscribe((state) => states.push(state));

    store.setChecked(false);
    store.setDisabled(false);
    store.setFocused(false);
    store.setChecked(true);

    expect(states).toHaveLength(1);
  });

  it("supports subscribe and unsubscribe", () => {
    let calls = 0;
    const store = new CheckedStore();
    const unsubscribe = store.subscribe(() => calls++);

    store.setChecked(true);
    unsubscribe();
    store.setChecked(false);

    expect(calls).toBe(1);
  });

  it("does not notify a listener unsubscribed during notification", () => {
    const calls: string[] = [];
    const store = new CheckedStore();
    let unsubscribeSecond = () => {};
    store.subscribe(() => {
      calls.push("first");
      unsubscribeSecond();
    });
    unsubscribeSecond = store.subscribe(() => calls.push("second"));

    store.setChecked(true);

    expect(calls).toEqual(["first"]);
  });

  it("replaces the checked-change callback", () => {
    const first: boolean[] = [];
    const second: boolean[] = [];
    const store = new CheckedStore({
      onCheckedChange: (value) => first.push(value),
    });

    store.setOnCheckedChange((value) => second.push(value));
    store.requestToggle();

    expect(first).toEqual([]);
    expect(second).toEqual([true]);
  });
});
