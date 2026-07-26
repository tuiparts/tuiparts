/** @jsxImportSource @opentui/react */

import { afterEach, expect, spyOn, test } from "bun:test";
import { TestRecorder, type TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  type NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  type NumberFieldInputRenderable,
  type NumberFieldRootRenderable,
  NumberFieldScrubAreaRenderable,
  NumberFieldStore,
} from "@tuiparts/core/number-field";
import { act, createElement, createRef, StrictMode, useState } from "react";
import { NumberField } from "./index";

let setup: TestRendererSetup | undefined;
afterEach(async () => {
  if (setup) await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("React NumberField provides authoritative state and retained Core refs", async () => {
  const rootRef = createRef<NumberFieldRootRenderable>();
  const inputRef = createRef<NumberFieldInputRenderable>();
  const incrementRef = createRef<NumberFieldIncrementRenderable>();
  const scrubRef = createRef<NumberFieldScrubAreaRenderable>();
  setup = await testRender(
    createElement(
      NumberField.Root,
      { defaultValue: 2, ref: rootRef },
      createElement(NumberField.ScrubArea, { ref: scrubRef }),
      createElement(NumberField.Input, { ref: inputRef }),
      createElement(NumberField.Increment, { ref: incrementRef }),
    ),
    { width: 30, height: 4 },
  );

  expect(rootRef.current?.value).toBe(2);
  await act(async () => incrementRef.current?.press());
  expect(rootRef.current?.value).toBe(3);
  expect(inputRef.current?.value).toBe("3");
  expect(scrubRef.current).toBeInstanceOf(NumberFieldScrubAreaRenderable);
});

test("React NumberField updates controlled props and callbacks without replacing identity", async () => {
  const calls: string[] = [];
  const rootRef = createRef<NumberFieldRootRenderable>();
  const incrementRef = createRef<NumberFieldIncrementRenderable>();
  let release = () => {};
  let replace = () => {};
  function App() {
    const [value, setValue] = useState<number | null | undefined>(4);
    const [replacement, setReplacement] = useState(false);
    release = () => setValue(undefined);
    replace = () => setReplacement(true);
    return createElement(
      NumberField.Root,
      {
        onValueChange: (next) =>
          calls.push(`${replacement ? "new" : "old"}:${next}`),
        ref: rootRef,
        value,
      },
      createElement(NumberField.Input),
      createElement(NumberField.Increment, { ref: incrementRef }),
    );
  }
  setup = await testRender(createElement(App), { width: 20, height: 3 });
  const retainedRoot = rootRef.current;
  const retainedIncrement = incrementRef.current;
  const retainedStore = rootRef.current?.store;

  await act(async () => replace());
  await act(async () => release());
  await act(async () => incrementRef.current?.press());

  expect(calls).toEqual(["new:5"]);
  expect(rootRef.current?.value).toBe(5);
  expect(rootRef.current).toBe(retainedRoot);
  expect(incrementRef.current).toBe(retainedIncrement);
  expect(rootRef.current?.store).toBe(retainedStore);
});

test("React NumberField applies paired bound changes atomically", async () => {
  const rootRef = createRef<NumberFieldRootRenderable>();
  let lowerBounds = () => {};
  function App() {
    const [bounds, setBounds] = useState({ max: 40, min: 30 });
    lowerBounds = () => setBounds({ max: 20, min: 0 });
    return createElement(NumberField.Root, {
      ...bounds,
      ref: rootRef,
      value: 35,
    });
  }
  setup = await testRender(createElement(App), { width: 20, height: 3 });
  expect(rootRef.current?.value).toBe(35);

  await act(async () => lowerBounds());
  expect(rootRef.current?.value).toBe(20);
});

test("React NumberField never renders a stale controlled frame", async () => {
  let setValue: (value: number) => void = () => {};
  function App() {
    const [value, updateValue] = useState(1);
    setValue = updateValue;
    return (
      <box flexDirection="column">
        <NumberField.Root value={value} flexDirection="column">
          {(state: NumberField.Root.State) => (
            <>
              <text content={`state:${state.value}`} />
              <NumberField.Input />
            </>
          )}
        </NumberField.Root>
        <text content={`owner:${value}`} />
      </box>
    );
  }
  setup = await testRender(<App />, { width: 20, height: 4 });
  await act(async () => setup?.renderOnce());
  const recorder = new TestRecorder(setup.renderer);

  recorder.rec();
  await act(async () => setValue(2));
  await act(async () =>
    setup?.waitForFrame((frame) => frame.includes("state:2")),
  );
  recorder.stop();

  expect(recorder.recordedFrames.length).toBeGreaterThan(0);
  expect(
    recorder.recordedFrames.every(({ frame }) => {
      const lines = frame.split("\n").map((line) => line.trim());
      return (
        lines.includes("state:2") &&
        lines.includes("2") &&
        lines.includes("owner:2")
      );
    }),
  ).toBe(true);
});

test("React NumberField provides initial and reactive Root and step state", async () => {
  const rootStates: NumberField.Root.State[] = [];
  const stepStates: NumberField.Increment.State[] = [];
  const incrementRef = createRef<NumberFieldIncrementRenderable>();
  setup = await testRender(
    <NumberField.Root defaultValue={1} max={2}>
      {(state: NumberField.Root.State) => {
        rootStates.push(state);
        return (
          <NumberField.Increment ref={incrementRef}>
            {(stepState: NumberField.Increment.State) => {
              stepStates.push(stepState);
              return null;
            }}
          </NumberField.Increment>
        );
      }}
    </NumberField.Root>,
    { width: 20, height: 3 },
  );
  expect(rootStates[0]).toEqual({
    disabled: false,
    focused: false,
    inputValue: "1",
    readOnly: false,
    scrubbing: false,
    value: 1,
  });
  expect(Object.isFrozen(rootStates[0])).toBe(true);
  expect(stepStates[0]).toEqual({ disabled: false });
  expect(Object.isFrozen(stepStates[0])).toBe(true);

  await act(async () => incrementRef.current?.press());
  expect(rootStates.at(-1)?.value).toBe(2);
  expect(stepStates.at(-1)?.disabled).toBe(true);
});

test("React NumberField releases and remounts conditional Parts", async () => {
  const rootRef = createRef<NumberFieldRootRenderable>();
  const inputRef = createRef<NumberFieldInputRenderable>();
  const incrementRef = createRef<NumberFieldIncrementRenderable>();
  const decrementRef = createRef<NumberFieldDecrementRenderable>();
  const scrubRef = createRef<NumberFieldScrubAreaRenderable>();
  let setVisible: (visible: boolean) => void = () => {};
  function App() {
    const [visible, updateVisible] = useState(true);
    setVisible = updateVisible;
    return (
      <NumberField.Root defaultValue={0} ref={rootRef}>
        {visible ? (
          <>
            <NumberField.Input ref={inputRef} />
            <NumberField.Increment ref={incrementRef} />
            <NumberField.Decrement ref={decrementRef} />
            <NumberField.ScrubArea ref={scrubRef} />
          </>
        ) : null}
      </NumberField.Root>
    );
  }
  setup = await testRender(<App />, { width: 20, height: 3 });
  const retainedIncrement = incrementRef.current;

  await act(async () => setVisible(false));
  expect(inputRef.current).toBeNull();
  expect(incrementRef.current).toBeNull();
  expect(decrementRef.current).toBeNull();
  expect(scrubRef.current).toBeNull();
  retainedIncrement?.press();
  expect(rootRef.current?.value).toBe(0);

  await act(async () => setVisible(true));
  expect(incrementRef.current).toBeInstanceOf(NumberFieldIncrementRenderable);
  expect(incrementRef.current).not.toBe(retainedIncrement);
  await act(async () => incrementRef.current?.press());
  expect(rootRef.current?.value).toBe(1);
});

test("React NumberField is StrictMode-safe and rejects orphan Parts", async () => {
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
      createElement(
        StrictMode,
        null,
        createElement(
          NumberField.Root,
          null,
          createElement(NumberField.Input),
          createElement(NumberField.Increment),
          createElement(NumberField.Decrement),
          createElement(NumberField.ScrubArea),
        ),
      ),
      { width: 20, height: 3 },
    );
    expect(activeSubscriptions).toBeGreaterThan(0);
    await act(async () => setup?.renderer.destroy());
    setup = undefined;
    expect(activeSubscriptions).toBe(0);
  } finally {
    NumberFieldStore.prototype.subscribe = originalSubscribe;
  }

  const error = spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const [part, orphan] of [
      ["Input", createElement(NumberField.Input, { key: "input" })],
      ["Increment", createElement(NumberField.Increment, { key: "increment" })],
      ["Decrement", createElement(NumberField.Decrement, { key: "decrement" })],
      ["ScrubArea", createElement(NumberField.ScrubArea, { key: "scrub" })],
    ] as const) {
      setup = await testRender(orphan, { width: 10, height: 2 });
      expect(
        error.mock.calls.some((call) =>
          call.some((value) =>
            String(value).includes(
              `NumberField.${part} must be rendered inside NumberField.Root`,
            ),
          ),
        ),
      ).toBe(true);
      await act(async () => setup?.renderer.destroy());
      setup = undefined;
    }
  } finally {
    error.mockRestore();
  }
});
