/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import type { ToggleGroupRenderable } from "@tuiparts/core/toggle-group";
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
