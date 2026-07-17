/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import { act } from "react";
import { Toggle } from "./components/ui/toggle";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Toggle recipe runtime smoke", async () => {
  setup = await testRender(<Toggle id="toggle" label="Bold" />, {
    width: 20,
    height: 3,
  });
  const toggle = setup.renderer.root.findDescendantById("toggle");
  if (!(toggle instanceof ToggleRenderable))
    throw new Error("Expected ToggleRenderable toggle");
  await act(async () => toggle.press());
  expect(toggle.pressed).toBe(true);
});
