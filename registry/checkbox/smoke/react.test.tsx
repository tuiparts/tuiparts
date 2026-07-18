/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { act } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

function root(id: string): CheckboxRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as CheckboxRootRenderable;
}

function text(node: BaseRenderable): string[] {
  if (!node.visible) return [];
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Checkbox recipe runtime smoke", async () => {
  setup = await testRender(
    <box flexDirection="column">
      <Checkbox id="uncontrolled" label="Uncontrolled" />
      <Checkbox id="custom-mark" label="Custom mark" defaultChecked mark="x" />
    </box>,
    { width: 40, height: 4 },
  );

  const uncontrolled = root("uncontrolled");
  expect(uncontrolled.checked).toBe(false);
  expect(text(uncontrolled)).toEqual(["Uncontrolled"]);
  await act(async () => uncontrolled.press());
  await setup.waitFor(() => uncontrolled.checked);
  expect(text(uncontrolled)).toEqual(["✓", "Uncontrolled"]);

  expect(text(root("custom-mark"))).toEqual(["x", "Custom mark"]);
});

test("restyles rendered checkboxes on theme switch", async () => {
  theme.register("smoke", {
    tokens: { colors: { primary: "#123456" }, glyphs: { check: "x" } },
  });
  setup = await testRender(
    <Checkbox id="themed" label="Theme" defaultChecked />,
    { width: 30, height: 3 },
  );
  const themed = root("themed");
  expect(text(themed)).toEqual(["✓", "Theme"]);

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() => text(themed).join(" ") === "x Theme");

  expect(setup.renderer.root.findDescendantById("themed")).toBe(themed);
  await act(async () => {
    theme.setActive("terminal");
  });
});
