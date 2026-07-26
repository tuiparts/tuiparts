/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  NumberFieldRootRenderable,
  NumberFieldScrubAreaRenderable,
} from "@tuiparts/core/number-field";
import { NumberFieldStore } from "@tuiparts/core/number-field";
import { createSignal, ErrorBoundary } from "solid-js";
import { NumberField } from "./index";

let setup: TestRendererSetup | undefined;
afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("Solid NumberField provides reactive state and Core refs", async () => {
  let root: NumberFieldRootRenderable | undefined;
  let input: NumberFieldInputRenderable | undefined;
  let increment: NumberFieldIncrementRenderable | undefined;
  let scrub: NumberFieldScrubAreaRenderable | undefined;
  setup = await testRender(
    () => (
      <NumberField.Root defaultValue={2} ref={(value) => (root = value)}>
        <NumberField.ScrubArea ref={(value) => (scrub = value)} />
        <NumberField.Input ref={(value) => (input = value)} />
        <NumberField.Increment ref={(value) => (increment = value)} />
      </NumberField.Root>
    ),
    { width: 30, height: 4 },
  );

  expect(root?.value).toBe(2);
  increment?.press();
  expect(root?.value).toBe(3);
  expect(input?.value).toBe("3");
  expect(scrub).toBeDefined();
});

test("Solid NumberField reactively updates ownership and callbacks without replacing identity", async () => {
  const calls: string[] = [];
  let root: NumberFieldRootRenderable | undefined;
  let input: NumberFieldInputRenderable | undefined;
  let increment: NumberFieldIncrementRenderable | undefined;
  let release = () => {};
  let replace = () => {};
  setup = await testRender(
    () => {
      const [value, setValue] = createSignal<number | null | undefined>(4);
      const [replacement, setReplacement] = createSignal(false);
      release = () => setValue(undefined);
      replace = () => setReplacement(true);
      return (
        <NumberField.Root
          value={value()}
          onValueChange={(next) =>
            calls.push(`${replacement() ? "new" : "old"}:${next}`)
          }
          ref={(renderable) => (root = renderable)}
        >
          <NumberField.Input ref={(renderable) => (input = renderable)} />
          <NumberField.Increment
            ref={(renderable) => (increment = renderable)}
          />
        </NumberField.Root>
      );
    },
    { width: 20, height: 3 },
  );
  const retainedRoot = root;
  const retainedInput = input;
  const retainedIncrement = increment;
  const retainedStore = root?.store;

  replace();
  release();
  increment?.press();
  await setup.waitFor(() => root?.value === 5);

  expect(calls).toEqual(["new:5"]);
  expect(root).toBe(retainedRoot);
  expect(input).toBe(retainedInput);
  expect(increment).toBe(retainedIncrement);
  expect(root?.store).toBe(retainedStore);

  setup.renderer.destroy();
  setup = undefined;
  expect(root).toBeUndefined();
  expect(input).toBeUndefined();
  expect(increment).toBeUndefined();
});

test("Solid NumberField applies paired bound changes atomically", async () => {
  let root: NumberFieldRootRenderable | undefined;
  let lowerBounds = () => {};
  setup = await testRender(
    () => {
      const [bounds, setBounds] = createSignal({ max: 40, min: 30 });
      lowerBounds = () => setBounds({ max: 20, min: 0 });
      return (
        <NumberField.Root
          max={bounds().max}
          min={bounds().min}
          ref={(value) => (root = value)}
          value={35}
        />
      );
    },
    { width: 20, height: 3 },
  );
  expect(root?.value).toBe(35);

  lowerBounds();
  await setup.waitFor(() => root?.value === 20);
});

test("Solid NumberField provides reactive Root and bound step state without recreating Parts", async () => {
  let increment: NumberFieldIncrementRenderable | undefined;
  let rootState: NumberField.Root.State | undefined;
  let incrementState: NumberField.Increment.State | undefined;
  setup = await testRender(
    () => (
      <NumberField.Root defaultValue={1} max={2} flexDirection="column">
        {(state: NumberField.Root.State) => {
          rootState = state;
          return (
            <>
              <text content={`value:${state.value}`} />
              <NumberField.Increment ref={(value) => (increment = value)}>
                {(stepState: NumberField.Increment.State) => {
                  incrementState = stepState;
                  return (
                    <text
                      content={
                        stepState.disabled ? "step:disabled" : "step:enabled"
                      }
                    />
                  );
                }}
              </NumberField.Increment>
            </>
          );
        }}
      </NumberField.Root>
    ),
    { width: 20, height: 3 },
  );
  const retainedIncrement = increment;
  await setup.renderOnce();
  expect(setup.captureCharFrame()).toContain("value:1");
  expect(setup.captureCharFrame()).toContain("step:enabled");
  expect(Object.isFrozen(rootState)).toBe(true);
  expect(Object.isFrozen(incrementState)).toBe(true);

  increment?.press();
  await setup.waitForFrame((frame) => frame.includes("value:2"));
  expect(setup.captureCharFrame()).toContain("step:disabled");
  expect(increment).toBe(retainedIncrement);
});

test("Solid NumberField releases and remounts conditional Parts", async () => {
  let root: NumberFieldRootRenderable | undefined;
  let input: NumberFieldInputRenderable | undefined;
  let increment: NumberFieldIncrementRenderable | undefined;
  let decrement: NumberFieldDecrementRenderable | undefined;
  let scrub: NumberFieldScrubAreaRenderable | undefined;
  let setVisible: (visible: boolean) => void = () => {};
  setup = await testRender(
    () => {
      const [visible, updateVisible] = createSignal(true);
      setVisible = updateVisible;
      return (
        <NumberField.Root defaultValue={0} ref={(value) => (root = value)}>
          {visible() ? (
            <>
              <NumberField.Input ref={(value) => (input = value)} />
              <NumberField.Increment ref={(value) => (increment = value)} />
              <NumberField.Decrement ref={(value) => (decrement = value)} />
              <NumberField.ScrubArea ref={(value) => (scrub = value)} />
            </>
          ) : null}
        </NumberField.Root>
      );
    },
    { width: 20, height: 3 },
  );
  const retainedIncrement = increment;

  setVisible(false);
  await setup.waitFor(() => increment === undefined);
  expect(input).toBeUndefined();
  expect(decrement).toBeUndefined();
  expect(scrub).toBeUndefined();
  retainedIncrement?.press();
  expect(root?.value).toBe(0);

  setVisible(true);
  await setup.waitFor(() => increment !== undefined);
  expect(increment).not.toBe(retainedIncrement);
  increment?.press();
  expect(root?.value).toBe(1);
});

test("Solid NumberField releases subscriptions and reports orphan Parts", async () => {
  const originalSubscribe = NumberFieldStore.prototype.subscribe;
  let activeSubscriptions = 0;
  NumberFieldStore.prototype.subscribe = function subscribe(listener) {
    activeSubscriptions += 1;
    const unsubscribe = originalSubscribe.call(this, listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      activeSubscriptions -= 1;
      unsubscribe();
    };
  };
  try {
    setup = await testRender(
      () => (
        <NumberField.Root>
          <NumberField.Input />
          <NumberField.Increment />
          <NumberField.Decrement />
          <NumberField.ScrubArea />
        </NumberField.Root>
      ),
      { width: 20, height: 3 },
    );
    expect(activeSubscriptions).toBeGreaterThan(0);
    setup.renderer.destroy();
    setup = undefined;
    expect(activeSubscriptions).toBe(0);
  } finally {
    NumberFieldStore.prototype.subscribe = originalSubscribe;
  }

  for (const [expected, child] of [
    ["Input", () => <NumberField.Input />],
    ["Increment", () => <NumberField.Increment />],
    ["Decrement", () => <NumberField.Decrement />],
    ["ScrubArea", () => <NumberField.ScrubArea />],
  ] as const) {
    let error = "";
    setup = await testRender(
      () => (
        <ErrorBoundary
          fallback={(value: unknown) => {
            error = String(value);
            return null;
          }}
        >
          {child()}
        </ErrorBoundary>
      ),
      { width: 10, height: 2 },
    );
    expect(error).toContain(
      `NumberField.${expected} must be rendered inside NumberField.Root`,
    );
    setup.renderer.destroy();
    setup = undefined;
  }
});
