/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import { theme } from "./components/ui/theme";
import { Toggle } from "./components/ui/toggle";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid Toggle recipe runtime smoke", async () => {
  setup = await testRender(() => <Toggle id="toggle" label="Bold" />, {
    width: 20,
    height: 3,
  });
  const toggle = setup.renderer.root.findDescendantById("toggle");
  if (!(toggle instanceof ToggleRenderable))
    throw new Error("Expected ToggleRenderable toggle");
  toggle.press();
  expect(toggle.pressed).toBe(true);
});

test("restyles rendered toggles on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(
    () => <Toggle id="themed" defaultPressed label="Theme" />,
    { width: 20, height: 3 },
  );
  const themed = setup.renderer.root.findDescendantById(
    "themed",
  ) as ToggleRenderable;
  const surface = themed.getChildren()[0] as BoxRenderable;

  theme.setActive("smoke");
  await setup.waitFor(() =>
    surface.backgroundColor.equals(parseColor("#123456")),
  );

  expect(setup.renderer.root.findDescendantById("themed")).toBe(themed);
  theme.setActive("terminal");
});
