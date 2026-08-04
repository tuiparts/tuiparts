/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { type KeyEvent, parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { SliderRootRenderable } from "@tuiparts/core/slider";
import { SliderTrackRenderable } from "@tuiparts/core/slider";
import { Slider } from "./components/ui/slider";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
let slider: SliderRootRenderable | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
  slider = undefined;
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

test("installed Solid Slider recipe runtime smoke", async () => {
  setup = await testRender(
    () => (
      <Slider
        defaultValue={2}
        label="Volume"
        max={4}
        ref={(value) => (slider = value)}
        trackSize={9}
      />
    ),
    { width: 30, height: 4 },
  );
  const track = slider?.getChildren()[1];
  if (!(track instanceof SliderTrackRenderable))
    throw new Error("Expected Slider Track");

  track.handleKeyPress(rightKey());
  await setup.waitFor(() => slider?.value === 3);
  expect(setup.captureCharFrame()).toContain("Volume: 3");
  expect(track.getChildren()).toHaveLength(3);
});

test("restyles the Solid Slider label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await testRender(
    () => <Slider label="Volume" ref={(value) => (slider = value)} />,
    { width: 30, height: 4 },
  );
  const label = slider?.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected Slider label TextRenderable");

  theme.setActive("smoke");
  await setup.waitFor(() => label.fg.equals(parseColor("#123456")));
  theme.setActive("terminal");
});
