/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { CheckboxGroupRenderable } from "@tuiparts/core/checkbox-group";
import { act } from "react";
import {
  CheckboxGroup,
  CheckboxGroupItem,
} from "./components/ui/checkbox-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React CheckboxGroup recipe runtime smoke", async () => {
  setup = await testRender(
    <CheckboxGroup id="group">
      <CheckboxGroupItem id="left" label="Left" value="left" />
    </CheckboxGroup>,
    { width: 30, height: 3 },
  );
  const group = setup.renderer.root.findDescendantById("group");
  const left = setup.renderer.root.findDescendantById("left");
  if (!(group instanceof CheckboxGroupRenderable))
    throw new Error("Expected CheckboxGroupRenderable group");
  if (!(left instanceof CheckboxRootRenderable))
    throw new Error("Expected CheckboxRootRenderable left");
  await setup.waitFor(() => {
    const key = left.groupKey;
    return key ? group.store.getItemState(key)?.available === true : false;
  });
  await act(async () => left.press());
  expect(group.value).toEqual(["left"]);
});

test("restyles rendered items on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(
    <CheckboxGroup id="themed" defaultValue={["left"]}>
      <CheckboxGroupItem id="themed-left" label="Left" value="left" />
    </CheckboxGroup>,
    { width: 30, height: 3 },
  );
  const left = setup.renderer.root.findDescendantById("themed-left");
  if (!(left instanceof CheckboxRootRenderable))
    throw new Error("Expected themed CheckboxRootRenderable");
  const indicator = left.getChildren()[0]?.getChildren()[0];
  const mark = indicator?.getChildren()[0];
  if (!(mark instanceof TextRenderable))
    throw new Error("Expected Checkbox mark TextRenderable");

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() => mark.fg.equals(parseColor("#123456")));

  expect(setup.renderer.root.findDescendantById("themed-left")).toBe(left);
  await act(async () => {
    theme.setActive("terminal");
  });
});
