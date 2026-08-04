/** @jsxImportSource @opentui/react */

import { afterEach, expect, spyOn, test } from "bun:test";
import { TestRecorder, type TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  SliderRangeRenderable,
  type SliderRootRenderable,
  SliderStore,
  SliderThumbRenderable,
  SliderTrackRenderable,
} from "@tuiparts/core/slider";
import { act, createElement, createRef, StrictMode, useState } from "react";
import { Slider } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  if (setup) await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

function pressKey(track: SliderTrackRenderable, name: string): void {
  // SAFETY: Slider reads only the key name and modifier/default-prevention
  // fields supplied here; OpenTUI supplies the remaining fields at runtime.
  track.handleKeyPress({
    ctrl: false,
    defaultPrevented: false,
    hyper: false,
    meta: false,
    name,
    option: false,
    shift: false,
    super: false,
  } as Parameters<SliderTrackRenderable["handleKeyPress"]>[0]);
}

test("React Slider provides authoritative state, Core refs, and one interaction round-trip", async () => {
  const states: Slider.Root.State[] = [];
  const rootRef = createRef<SliderRootRenderable>();
  const trackRef = createRef<SliderTrackRenderable>();
  const rangeRef = createRef<SliderRangeRenderable>();
  const thumbRef = createRef<SliderThumbRenderable>();
  setup = await testRender(
    <Slider.Root defaultValue={2} max={4} ref={rootRef}>
      {(state: Slider.Root.State) => {
        states.push(state);
        return (
          <Slider.Track height={1} ref={trackRef} width={20}>
            <Slider.Range ref={rangeRef} />
            <Slider.Thumb ref={thumbRef} />
          </Slider.Track>
        );
      }}
    </Slider.Root>,
    { width: 30, height: 4 },
  );

  expect(rootRef.current?.value).toBe(2);
  expect(trackRef.current).toBeInstanceOf(SliderTrackRenderable);
  expect(rangeRef.current).toBeInstanceOf(SliderRangeRenderable);
  expect(thumbRef.current).toBeInstanceOf(SliderThumbRenderable);
  expect(Object.isFrozen(states[0])).toBe(true);

  const track = trackRef.current;
  if (!track) throw new Error("Expected Slider Track");
  await act(async () => pressKey(track, "right"));
  expect(rootRef.current?.value).toBe(3);
  expect(states.at(-1)?.value).toBe(3);
});

test("React Slider preserves a controlled drag across owner feedback", async () => {
  const changes: number[] = [];
  const commits: number[] = [];
  const rootRef = createRef<SliderRootRenderable>();
  const trackRef = createRef<SliderTrackRenderable>();
  function App() {
    const [value, setValue] = useState(20);
    return (
      <Slider.Root
        max={100}
        onValueChange={(next) => {
          changes.push(next);
          setValue(next);
        }}
        onValueCommit={(next) => commits.push(next)}
        ref={rootRef}
        step={5}
        value={value}
      >
        <Slider.Track height={1} ref={trackRef} width={20} />
      </Slider.Root>
    );
  }
  setup = await testRender(<App />, { width: 30, height: 4 });
  await act(async () => setup?.renderOnce());
  const track = trackRef.current;
  if (!track) throw new Error("Expected Slider Track");

  await act(async () => setup?.mockMouse.pressDown(track.x + 2, track.y));
  await act(async () =>
    setup?.mockMouse.emitMouseEvent("drag", track.x + 12, track.y),
  );
  await act(async () =>
    setup?.mockMouse.emitMouseEvent("drag", track.x + 18, track.y),
  );
  await act(async () => setup?.mockMouse.release(track.x + 18, track.y));

  const committed = rootRef.current?.value;
  if (committed === undefined) throw new Error("Expected Slider Root");
  expect(changes.length).toBeGreaterThan(1);
  expect(committed).toBeGreaterThan(50);
  expect(commits).toEqual([committed]);
});

test("React Slider updates ownership and callbacks without replacing identity", async () => {
  const calls: string[] = [];
  const rootRef = createRef<SliderRootRenderable>();
  const trackRef = createRef<SliderTrackRenderable>();
  let release = () => {};
  let replace = () => {};
  let rotate = () => {};
  function App() {
    const [value, setValue] = useState<number | undefined>(4);
    const [replacement, setReplacement] = useState(false);
    const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
      "horizontal",
    );
    release = () => setValue(undefined);
    replace = () => setReplacement(true);
    rotate = () => setOrientation("vertical");
    return (
      <Slider.Root
        max={10}
        onValueChange={(next) =>
          calls.push(`${replacement ? "new" : "old"}:${next}`)
        }
        orientation={orientation}
        ref={rootRef}
        value={value}
      >
        <Slider.Track ref={trackRef} />
      </Slider.Root>
    );
  }
  setup = await testRender(<App />, { width: 30, height: 4 });
  const retainedRoot = rootRef.current;
  const retainedTrack = trackRef.current;
  if (!retainedTrack) throw new Error("Expected Slider Track");
  const retainedStore = rootRef.current?.store;

  await act(async () => replace());
  await act(async () => rotate());
  await act(async () => release());
  const updatedTrack = trackRef.current;
  if (!updatedTrack) throw new Error("Expected Slider Track");
  await act(async () => pressKey(updatedTrack, "up"));

  expect(calls).toEqual(["new:5"]);
  expect(rootRef.current?.value).toBe(5);
  expect(rootRef.current?.orientation).toBe("vertical");
  expect(trackRef.current?.orientation).toBe("vertical");
  expect(rootRef.current).toBe(retainedRoot);
  expect(trackRef.current).toBe(retainedTrack);
  expect(rootRef.current?.store).toBe(retainedStore);
});

test("React Slider never renders a stale controlled frame", async () => {
  let setValue: (value: number) => void = () => {};
  function App() {
    const [value, updateValue] = useState(1);
    setValue = updateValue;
    return (
      <box flexDirection="column">
        <Slider.Root value={value}>
          {(state: Slider.Root.State) => (
            <text content={`state:${state.value}`} />
          )}
        </Slider.Root>
        <text content={`owner:${value}`} />
      </box>
    );
  }
  setup = await testRender(<App />, { width: 20, height: 3 });
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
      return lines.includes("state:2") && lines.includes("owner:2");
    }),
  ).toBe(true);
});

test("React Slider releases conditional Parts and rejects orphan Parts safely", async () => {
  const rootRef = createRef<SliderRootRenderable>();
  const trackRef = createRef<SliderTrackRenderable>();
  const rangeRef = createRef<SliderRangeRenderable>();
  const thumbRef = createRef<SliderThumbRenderable>();
  let setVisible: (visible: boolean) => void = () => {};
  function App() {
    const [visible, updateVisible] = useState(true);
    setVisible = updateVisible;
    return (
      <Slider.Root ref={rootRef}>
        {visible ? (
          <Slider.Track ref={trackRef}>
            <Slider.Range ref={rangeRef} />
            <Slider.Thumb ref={thumbRef} />
          </Slider.Track>
        ) : null}
      </Slider.Root>
    );
  }
  setup = await testRender(
    createElement(StrictMode, null, createElement(App)),
    { width: 20, height: 3 },
  );
  const retainedTrack = trackRef.current;

  await act(async () => setVisible(false));
  expect(trackRef.current).toBeNull();
  expect(rangeRef.current).toBeNull();
  expect(thumbRef.current).toBeNull();
  retainedTrack && pressKey(retainedTrack, "right");
  expect(rootRef.current?.value).toBe(0);

  await act(async () => setVisible(true));
  expect(trackRef.current).toBeInstanceOf(SliderTrackRenderable);
  expect(trackRef.current).not.toBe(retainedTrack);

  await act(async () => setup?.renderer.destroy());
  setup = undefined;

  const error = spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const [part, orphan] of [
      ["Track", createElement(Slider.Track, { key: "track" })],
      ["Range", createElement(Slider.Range, { key: "range" })],
      ["Thumb", createElement(Slider.Thumb, { key: "thumb" })],
    ] as const) {
      setup = await testRender(orphan, { width: 10, height: 2 });
      expect(
        error.mock.calls.some((call) =>
          call.some((value) =>
            String(value).includes(
              `Slider.${part} must be rendered inside Slider.Root`,
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

test("React Slider removes Store subscriptions under StrictMode teardown", async () => {
  const originalSubscribe = SliderStore.prototype.subscribe;
  let activeSubscriptions = 0;
  SliderStore.prototype.subscribe = function subscribe(listener) {
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
      <StrictMode>
        <Slider.Root>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>
      </StrictMode>,
      { width: 20, height: 3 },
    );
    expect(activeSubscriptions).toBeGreaterThan(0);
    await act(async () => setup?.renderer.destroy());
    setup = undefined;
    expect(activeSubscriptions).toBe(0);
  } finally {
    SliderStore.prototype.subscribe = originalSubscribe;
  }
});
