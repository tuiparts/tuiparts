/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type KeyEvent, parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  SliderRootRenderable,
  SliderTrackRenderable,
} from "@tuiparts/core/slider";
import { act } from "react";
import { Slider } from "./components/ui/slider";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
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

test("installed React Slider recipe runtime smoke", async () => {
  setup = await testRender(
    <Slider
      defaultValue={2}
      id="slider"
      label="Volume"
      max={4}
      trackSize={9}
    />,
    { width: 30, height: 4 },
  );
  const slider = setup.renderer.root.findDescendantById("slider");
  if (!(slider instanceof SliderRootRenderable))
    throw new Error("Expected Slider Root");
  const track = slider.getChildren()[1];
  if (!(track instanceof SliderTrackRenderable))
    throw new Error("Expected Slider Track");

  await act(async () => track.handleKeyPress(rightKey()));
  expect(slider.value).toBe(3);
  expect(setup.captureCharFrame()).toContain("Volume: 3");
  expect(track.getChildren()).toHaveLength(3);
});

test("restyles the React Slider label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await testRender(<Slider id="themed" label="Volume" />, {
    width: 30,
    height: 4,
  });
  const slider = setup.renderer.root.findDescendantById("themed");
  if (!(slider instanceof SliderRootRenderable))
    throw new Error("Expected Slider Root");
  const label = slider.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected Slider label TextRenderable");

  await act(async () => theme.setActive("smoke"));
  await setup.waitFor(() => label.fg.equals(parseColor("#123456")));
  await act(async () => theme.setActive("terminal"));
});
