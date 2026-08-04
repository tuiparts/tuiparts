/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  SliderRangeRenderable,
  SliderRootRenderable,
  SliderThumbRenderable,
  SliderTrackRenderable,
} from "@tuiparts/core/slider";
import { SliderStore } from "@tuiparts/core/slider";
import { createSignal, ErrorBoundary } from "solid-js";
import { Slider } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
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

test("Solid Slider provides reactive state, Core refs, and one interaction round-trip", async () => {
  let root: SliderRootRenderable | undefined;
  let track: SliderTrackRenderable | undefined;
  let range: SliderRangeRenderable | undefined;
  let thumb: SliderThumbRenderable | undefined;
  let state: Slider.Root.State | undefined;
  setup = await testRender(
    () => (
      <Slider.Root defaultValue={2} max={4} ref={(value) => (root = value)}>
        {(next: Slider.Root.State) => {
          state = next;
          return (
            <Slider.Track
              height={1}
              ref={(value) => (track = value)}
              width={20}
            >
              <Slider.Range ref={(value) => (range = value)} />
              <Slider.Thumb ref={(value) => (thumb = value)} />
            </Slider.Track>
          );
        }}
      </Slider.Root>
    ),
    { width: 30, height: 4 },
  );

  expect(root?.value).toBe(2);
  expect(track).toBeDefined();
  expect(range).toBeDefined();
  expect(thumb).toBeDefined();
  expect(Object.isFrozen(state)).toBe(true);
  if (!track) throw new Error("Expected Slider Track");
  pressKey(track, "right");
  await setup.waitFor(() => root?.value === 3);
  expect(state?.value).toBe(3);
});

test("Solid Slider preserves a controlled drag across owner feedback", async () => {
  const changes: number[] = [];
  const commits: number[] = [];
  let root: SliderRootRenderable | undefined;
  let track: SliderTrackRenderable | undefined;
  setup = await testRender(
    () => {
      const [value, setValue] = createSignal(20);
      return (
        <Slider.Root
          max={100}
          onValueChange={(next) => {
            changes.push(next);
            setValue(next);
          }}
          onValueCommit={(next) => commits.push(next)}
          ref={(renderable) => (root = renderable)}
          step={5}
          value={value()}
        >
          <Slider.Track
            height={1}
            ref={(renderable) => (track = renderable)}
            width={20}
          />
        </Slider.Root>
      );
    },
    { width: 30, height: 4 },
  );
  await setup.renderOnce();
  if (!track) throw new Error("Expected Slider Track");

  await setup.mockMouse.pressDown(track.x + 2, track.y);
  await setup.mockMouse.emitMouseEvent("drag", track.x + 12, track.y);
  await setup.mockMouse.emitMouseEvent("drag", track.x + 18, track.y);
  await setup.mockMouse.release(track.x + 18, track.y);

  const committed = root?.value;
  if (committed === undefined) throw new Error("Expected Slider Root");
  expect(changes.length).toBeGreaterThan(1);
  expect(committed).toBeGreaterThan(50);
  expect(commits).toEqual([committed]);
});

test("Solid Slider reactively updates ownership and callbacks without replacing identity", async () => {
  const calls: string[] = [];
  let root: SliderRootRenderable | undefined;
  let track: SliderTrackRenderable | undefined;
  let release = () => {};
  let replace = () => {};
  let rotate = () => {};
  setup = await testRender(
    () => {
      const [value, setValue] = createSignal<number | undefined>(4);
      const [replacement, setReplacement] = createSignal(false);
      const [orientation, setOrientation] = createSignal<
        "horizontal" | "vertical"
      >("horizontal");
      release = () => setValue(undefined);
      replace = () => setReplacement(true);
      rotate = () => setOrientation("vertical");
      return (
        <Slider.Root
          max={10}
          onValueChange={(next) =>
            calls.push(`${replacement() ? "new" : "old"}:${next}`)
          }
          orientation={orientation()}
          ref={(value) => (root = value)}
          value={value()}
        >
          <Slider.Track ref={(value) => (track = value)} />
        </Slider.Root>
      );
    },
    { width: 30, height: 4 },
  );
  const retainedRoot = root;
  const retainedTrack = track;
  if (!retainedTrack) throw new Error("Expected Slider Track");
  const retainedStore = root?.store;

  replace();
  rotate();
  release();
  await setup.waitFor(() => root?.orientation === "vertical");
  if (!track) throw new Error("Expected Slider Track");
  pressKey(track, "up");
  await setup.waitFor(() => root?.value === 5);

  expect(calls).toEqual(["new:5"]);
  expect(root).toBe(retainedRoot);
  expect(track).toBe(retainedTrack);
  expect(root?.store).toBe(retainedStore);
  expect(track?.orientation).toBe("vertical");

  setup.renderer.destroy();
  setup = undefined;
  expect(root).toBeUndefined();
  expect(track).toBeUndefined();
});

test("Solid Slider releases and remounts conditional Parts", async () => {
  let root: SliderRootRenderable | undefined;
  let track: SliderTrackRenderable | undefined;
  let range: SliderRangeRenderable | undefined;
  let thumb: SliderThumbRenderable | undefined;
  let setVisible: (visible: boolean) => void = () => {};
  setup = await testRender(
    () => {
      const [visible, updateVisible] = createSignal(true);
      setVisible = updateVisible;
      return (
        <Slider.Root ref={(value) => (root = value)}>
          {visible() ? (
            <Slider.Track ref={(value) => (track = value)}>
              <Slider.Range ref={(value) => (range = value)} />
              <Slider.Thumb ref={(value) => (thumb = value)} />
            </Slider.Track>
          ) : null}
        </Slider.Root>
      );
    },
    { width: 20, height: 3 },
  );
  const retainedTrack = track;

  setVisible(false);
  await setup.waitFor(() => track === undefined);
  expect(range).toBeUndefined();
  expect(thumb).toBeUndefined();
  if (!retainedTrack) throw new Error("Expected retained Slider Track");
  pressKey(retainedTrack, "right");
  expect(root?.value).toBe(0);

  setVisible(true);
  await setup.waitFor(() => track !== undefined);
  expect(track).not.toBe(retainedTrack);
});

test("Solid Slider releases subscriptions and reports orphan Parts", async () => {
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
      () => (
        <Slider.Root>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>
      ),
      { width: 20, height: 3 },
    );
    expect(activeSubscriptions).toBeGreaterThan(0);
    setup.renderer.destroy();
    setup = undefined;
    expect(activeSubscriptions).toBe(0);
  } finally {
    SliderStore.prototype.subscribe = originalSubscribe;
  }

  for (const [expected, child] of [
    ["Track", () => <Slider.Track />],
    ["Range", () => <Slider.Range />],
    ["Thumb", () => <Slider.Thumb />],
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
      `Slider.${expected} must be rendered inside Slider.Root`,
    );
    setup.renderer.destroy();
    setup = undefined;
  }
});
