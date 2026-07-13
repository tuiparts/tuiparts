import { describe, expect, it } from "bun:test";
import { RadioGroupStore } from "./primitive";

describe("RadioGroupStore", () => {
  it("registers retained item identities and removes them without stale state", () => {
    const store = new RadioGroupStore();
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta", { disabled: true });

    expect(store.getItemState(alpha.key)).toEqual({
      value: "alpha",
      available: true,
      disabled: false,
      checked: false,
      tabbable: true,
    });
    expect(store.getItemState(beta.key)).toEqual({
      value: "beta",
      available: true,
      disabled: true,
      checked: false,
      tabbable: false,
    });
    expect(Object.isFrozen(store.getItemState(alpha.key))).toBe(true);
    expect(() => store.registerItem("alpha")).toThrow(
      'RadioGroup item value "alpha" is already registered',
    );

    alpha.unregister();
    expect(store.getItemState(alpha.key)).toBeUndefined();
    expect(store.getItemState(beta.key)).toBeDefined();

    beta.unregister();
    expect(store.getItemState(beta.key)).toBeUndefined();
  });

  it("owns uncontrolled selection and clears it when the checked item leaves", () => {
    const changes: string[] = [];
    const store = new RadioGroupStore({
      defaultValue: "alpha",
      onValueChange: (value) => changes.push(value),
    });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta");

    expect(store.state.value).toBe("alpha");
    expect(store.getItemState(alpha.key)?.checked).toBe(true);

    store.requestSelection(beta.key);
    expect(store.state.value).toBe("beta");
    expect(store.getItemState(alpha.key)?.checked).toBe(false);
    expect(store.getItemState(beta.key)?.checked).toBe(true);
    expect(changes).toEqual(["beta"]);

    store.requestSelection(beta.key);
    expect(changes).toEqual(["beta"]);

    alpha.unregister();
    expect(store.state.value).toBe("beta");
    beta.unregister();
    expect(store.state.value).toBeNull();
  });

  it("reports controlled intent and distinguishes controlled empty state", () => {
    const changes: string[] = [];
    const store = new RadioGroupStore({
      value: "alpha",
      onValueChange: (value) => changes.push(value),
    });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta");

    store.requestSelection(beta.key);
    expect(changes).toEqual(["beta"]);
    expect(store.state.value).toBe("alpha");

    store.setValue(null);
    expect(store.state.value).toBeNull();
    store.requestSelection(alpha.key);
    expect(changes).toEqual(["beta", "alpha"]);
    expect(store.state.value).toBeNull();

    store.setValue("beta");
    expect(store.getItemState(beta.key)?.checked).toBe(true);

    store.setValue(undefined);
    store.requestSelection(alpha.key);
    expect(store.state.value).toBe("alpha");
  });

  it("updates retained item props and rejects duplicate values", () => {
    const store = new RadioGroupStore({ defaultValue: "alpha" });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta");
    const initialBetaState = store.getItemState(beta.key);

    beta.setDisabled(true);
    expect(store.getItemState(beta.key)?.disabled).toBe(true);
    expect(store.getItemState(beta.key)).not.toBe(initialBetaState);
    expect(() => beta.setValue("alpha")).toThrow(
      'RadioGroup item value "alpha" is already registered',
    );

    alpha.setValue("renamed");
    expect(store.getItemState(alpha.key)).toEqual({
      value: "renamed",
      available: true,
      disabled: false,
      checked: true,
      tabbable: true,
    });
    expect(store.state.value).toBe("renamed");
  });

  it("ignores disabled groups, disabled items, and unknown identities", () => {
    const changes: string[] = [];
    const store = new RadioGroupStore({
      disabled: true,
      onValueChange: (value) => changes.push(value),
    });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta", { disabled: true });

    store.requestSelection(alpha.key);
    store.requestSelection(beta.key);
    store.requestSelection(Symbol("missing"));
    expect(store.state.value).toBeNull();
    expect(changes).toEqual([]);
    expect(store.getItemState(alpha.key)?.disabled).toBe(true);

    store.setDisabled(false);
    store.requestSelection(beta.key);
    expect(store.state.value).toBeNull();

    beta.setDisabled(false);
    store.requestSelection(beta.key);
    expect(store.state.value).toBe("beta");
    expect(changes).toEqual(["beta"]);
  });

  it("publishes stable frozen snapshots and notifies only on changes", () => {
    const store = new RadioGroupStore();
    const states: Array<{ value: string | null; disabled: boolean }> = [];
    const unsubscribe = store.subscribe((state) => states.push(state));
    const emptyState = store.state;
    const alpha = store.registerItem("alpha");
    const registeredState = store.state;
    const initialItemState = store.getItemState(alpha.key);

    store.requestSelection(alpha.key);
    const selectedItemState = store.getItemState(alpha.key);
    store.setDisabled(true);
    store.setDisabled(true);
    unsubscribe();
    alpha.setDisabled(true);

    expect(states).toHaveLength(3);
    expect(states.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(store.state)).toBe(true);
    expect(registeredState).not.toBe(emptyState);
    expect(store.getItemState(alpha.key)).not.toBe(selectedItemState);
    expect(selectedItemState).not.toBe(initialItemState);
  });

  it("tracks the active tab stop and publishes frozen selection details", () => {
    const changes: Array<{
      value: string;
      reason: string;
      source: string;
    }> = [];
    const store = new RadioGroupStore({
      onValueChange: (value, details) => changes.push({ value, ...details }),
    });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta");

    beta.setActive(true);
    expect(store.getItemState(alpha.key)?.tabbable).toBe(false);
    expect(store.getItemState(beta.key)?.tabbable).toBe(true);

    store.requestSelection(alpha.key, {
      reason: "activation",
      source: "keyboard",
    });
    expect(changes).toEqual([
      { value: "alpha", reason: "activation", source: "keyboard" },
    ]);

    beta.setActive(false);
  });

  it("serializes reentrant selection", () => {
    const changes: string[] = [];
    const observedValues: Array<string | null> = [];
    const store = new RadioGroupStore({
      onValueChange: (value) => changes.push(value),
    });
    const alpha = store.registerItem("alpha");
    const beta = store.registerItem("beta");
    store.subscribe((state) => {
      if (state.value === "alpha") store.requestSelection(beta.key);
    });
    store.subscribe((state) => observedValues.push(state.value));

    store.requestSelection(alpha.key);

    expect(changes).toEqual(["alpha", "beta"]);
    expect(observedValues).toEqual(["alpha", "beta"]);
    expect(store.state.value).toBe("beta");

    beta.setDisabled(true);
    expect(store.getItemState(beta.key)?.disabled).toBe(true);
  });
});
