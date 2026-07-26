/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import type { CheckboxGroupRenderable } from "@tuiparts/core/checkbox-group";
import {
  CheckboxGroup,
  CheckboxGroupItem,
} from "./components/ui/checkbox-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
let group: CheckboxGroupRenderable | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid CheckboxGroup recipe runtime smoke", async () => {
  setup = await testRender(
    () => (
      <CheckboxGroup ref={(value) => (group = value)}>
        <CheckboxGroupItem id="left" label="Left" value="left" />
      </CheckboxGroup>
    ),
    { width: 30, height: 3 },
  );
  const left = setup.renderer.root.findDescendantById("left");
  if (!(left instanceof CheckboxRootRenderable))
    throw new Error("Expected CheckboxRootRenderable left");
  left.press();
  expect(group?.value).toEqual(["left"]);
});

test("restyles rendered items on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(
    () => (
      <CheckboxGroup id="themed" defaultValue={["left"]}>
        <CheckboxGroupItem id="themed-left" label="Left" value="left" />
      </CheckboxGroup>
    ),
    { width: 30, height: 3 },
  );
  const left = setup.renderer.root.findDescendantById("themed-left");
  if (!(left instanceof CheckboxRootRenderable))
    throw new Error("Expected themed CheckboxRootRenderable");
  const indicator = left.getChildren()[0]?.getChildren()[0];
  const mark = indicator?.getChildren()[0];
  if (!(mark instanceof TextRenderable))
    throw new Error("Expected Checkbox mark TextRenderable");

  theme.setActive("smoke");
  await setup.waitFor(() => mark.fg.equals(parseColor("#123456")));

  expect(setup.renderer.root.findDescendantById("themed-left")).toBe(left);
  theme.setActive("terminal");
});
