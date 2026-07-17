/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import { ToggleGroupRenderable } from "@tuiparts/core/toggle-group";
import { act } from "react";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React ToggleGroup recipe runtime smoke", async () => {
  setup = await testRender(
    <ToggleGroup id="group">
      <ToggleGroupItem id="left" label="Left" value="left" />
    </ToggleGroup>,
    { width: 30, height: 3 },
  );
  const group = setup.renderer.root.findDescendantById("group");
  const left = setup.renderer.root.findDescendantById("left");
  if (!(group instanceof ToggleGroupRenderable))
    throw new Error("Expected ToggleGroupRenderable group");
  if (!(left instanceof ToggleRenderable))
    throw new Error("Expected ToggleRenderable left");
  await setup.waitFor(() => {
    const key = left.groupKey;
    return key ? group.store.getItemState(key)?.available === true : false;
  });
  await act(async () => left.press());
  expect(group.value).toEqual(["left"]);
});
