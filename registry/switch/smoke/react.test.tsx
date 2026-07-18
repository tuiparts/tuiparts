/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { SwitchRootRenderable } from "@tuiparts/core/switch";
import { act } from "react";
import { Switch } from "./components/ui/switch";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

function root(id: string): SwitchRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as SwitchRootRenderable;
}

test("installed React Switch recipe runtime smoke", async () => {
  setup = await testRender(
    <box flexDirection="column">
      <Switch id="uncontrolled" label="Uncontrolled" />
      <Switch
        id="custom"
        label="Custom"
        defaultChecked
        density="comfortable"
        symbols="ascii"
      />
    </box>,
    { width: 40, height: 4 },
  );

  const uncontrolled = root("uncontrolled");
  await act(async () => uncontrolled.press());
  await setup.waitFor(() => uncontrolled.checked);
  expect(uncontrolled.checked).toBe(true);

  expect(root("custom").checked).toBe(true);
});

test("restyles rendered switches on theme switch", async () => {
  function text(node: BaseRenderable): string[] {
    if (!node.visible) return [];
    return [
      ...(node instanceof TextRenderable ? [node.plainText] : []),
      ...node.getChildren().flatMap(text),
    ];
  }
  theme.register("smoke", {
    tokens: {
      colors: { primary: "#123456" },
      glyphs: { thumb: "@", track: "=" },
    },
  });
  setup = await testRender(<Switch id="themed" label="Theme" />, {
    width: 30,
    height: 3,
  });
  const themed = root("themed");
  expect(text(themed)).toEqual(["───", "●", "Theme"]);

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() => text(themed).join(" ") === "=== @ Theme");

  expect(setup.renderer.root.findDescendantById("themed")).toBe(themed);
  await act(async () => {
    theme.setActive("terminal");
  });
});
