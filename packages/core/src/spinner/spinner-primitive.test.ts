import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  SPINNER_FRAMES,
  type SpinnerFrameChangeDetails,
  SpinnerIndicatorRenderable,
  SpinnerLabelRenderable,
  SpinnerRootRenderable,
  SpinnerStore,
} from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Spinner primitive", () => {
  it("initializes with default braille frames and advances frames", async () => {
    const store = new SpinnerStore({ running: false });
    expect(store.state.frames).toEqual(SPINNER_FRAMES.braille);
    expect(store.state.frameIndex).toBe(0);
    expect(store.state.currentFrame).toBe("⠋");
    expect(store.state.running).toBe(false);

    store.nextFrame();
    expect(store.state.frameIndex).toBe(1);
    expect(store.state.currentFrame).toBe("⠙");

    store.reset();
    expect(store.state.frameIndex).toBe(0);
    expect(store.state.currentFrame).toBe("⠋");
    store.destroy();
  });

  it("notifies subscribers and onFrameChange callback on advancement", async () => {
    const frames: SpinnerFrameChangeDetails[] = [];
    const store = new SpinnerStore({
      frames: ["-", "\\", "|", "/"],
      running: false,
      onFrameChange: (details) => frames.push(details),
    });

    let listenerCount = 0;
    const unsub = store.subscribe(() => {
      listenerCount++;
    });

    store.nextFrame();
    expect(frames).toEqual([{ frameIndex: 1, currentFrame: "\\" }]);
    expect(listenerCount).toBe(1);

    unsub();
    store.nextFrame();
    expect(listenerCount).toBe(1);
    store.destroy();
  });

  it("updates IndicatorRenderable content reactively when store advances", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const store = new SpinnerStore({
      frames: ["1", "2", "3"],
      running: false,
    });
    const root = new SpinnerRootRenderable(setup.renderer, { store });
    const indicator = new SpinnerIndicatorRenderable(setup.renderer, { store });
    const label = new SpinnerLabelRenderable(setup.renderer, {
      content: "Loading...",
    });

    root.add(indicator);
    root.add(label);
    setup.renderer.root.add(root);

    expect(indicator.currentFrame).toBe("1");
    store.nextFrame();
    expect(indicator.currentFrame).toBe("2");
    store.nextFrame();
    expect(indicator.currentFrame).toBe("3");
    store.nextFrame();
    expect(indicator.currentFrame).toBe("1");

    root.destroy();
    store.destroy();
  });

  it("manages timer start and stop lifecycle", async () => {
    const store = new SpinnerStore({
      interval: 20,
      running: true,
    });
    expect(store.state.running).toBe(true);

    store.stop();
    expect(store.state.running).toBe(false);

    store.start();
    expect(store.state.running).toBe(true);

    store.destroy();
    expect(store.state.running).toBe(false);
  });
});
