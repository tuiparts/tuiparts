/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import type { ToggleGroupRenderable } from "@tuiparts/core/toggle-group";
import { theme } from "./components/ui/theme";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

let setup: TestRendererSetup | undefined;
let group: ToggleGroupRenderable | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid ToggleGroup recipe runtime smoke", async () => {
  setup = await testRender(
    () => (
      <ToggleGroup ref={(value) => (group = value)}>
        <ToggleGroupItem id="left" label="Left" value="left" />
      </ToggleGroup>
    ),
    { width: 30, height: 3 },
  );
  const left = setup.renderer.root.findDescendantById("left");
  if (!(left instanceof ToggleRenderable))
    throw new Error("Expected ToggleRenderable left");
  left.press();
  expect(group?.value).toEqual(["left"]);
});

test("restyles rendered items on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(
    () => (
      <ToggleGroup id="themed" defaultValue={["left"]}>
        <ToggleGroupItem id="themed-left" label="Left" value="left" />
      </ToggleGroup>
    ),
    { width: 30, height: 3 },
  );
  const left = setup.renderer.root.findDescendantById(
    "themed-left",
  ) as ToggleRenderable;
  const surface = left.getChildren()[0] as BoxRenderable;

  theme.setActive("smoke");
  await setup.waitFor(() =>
    surface.backgroundColor.equals(parseColor("#123456")),
  );

  expect(setup.renderer.root.findDescendantById("themed-left")).toBe(left);
  theme.setActive("terminal");
});
