import { afterEach, expect, test } from "bun:test";
import { type KeyEvent, parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { SliderTrackRenderable } from "@tuiparts/core/slider";
import { createSlider } from "./components/ui/slider";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function rightKey(): KeyEvent {
  // SAFETY: Slider reads only these key and modifier fields in this smoke.
  return {
    ctrl: false,
    defaultPrevented: false,
    hyper: false,
    meta: false,
    name: "right",
    option: false,
    shift: false,
    super: false,
  } as KeyEvent;
}

test("installed Core Slider recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 30, height: 4 });
  const slider = createSlider(setup.renderer, {
    defaultValue: 2,
    label: "Volume",
    max: 4,
    trackSize: 9,
  });
  setup.renderer.root.add(slider);
  await setup.renderOnce();

  const track = slider.getChildren()[1];
  if (!(track instanceof SliderTrackRenderable))
    throw new Error("Expected Slider Track");
  track.handleKeyPress(rightKey());
  await setup.renderOnce();
  expect(slider.value).toBe(3);
  expect(setup.captureCharFrame()).toContain("Volume: 3");
  expect(track.getChildren()).toHaveLength(3);
});

test("restyles the Core Slider label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await createTestRenderer({ width: 30, height: 4 });
  const slider = createSlider(setup.renderer, { label: "Volume" });
  setup.renderer.root.add(slider);
  await setup.renderOnce();

  const label = slider.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected Slider label TextRenderable");
  theme.setActive("smoke");
  expect(label.fg.equals(parseColor("#123456"))).toBe(true);
  theme.setActive("terminal");
});
