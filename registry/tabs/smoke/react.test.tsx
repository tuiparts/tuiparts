/** @jsxImportSource @opentui/react */
import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { TabsRootRenderable, TabsTabRenderable } from "@tuiparts/core/tabs";
import { act } from "react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./components/ui/tabs";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Tabs Recipe runtime smoke", async () => {
  setup = await testRender(
    <Tabs id="root">
      <TabsList>
        <TabsTab id="alpha" label="Alpha" value="alpha" />
        <TabsTab id="beta" label="Beta" value="beta" />
      </TabsList>
      <TabsPanel value="alpha" />
      <TabsPanel value="beta" />
    </Tabs>,
    { width: 40, height: 6 },
  );
  const root = setup.renderer.root.findDescendantById("root");
  const beta = setup.renderer.root.findDescendantById("beta");
  if (
    !(root instanceof TabsRootRenderable) ||
    !(beta instanceof TabsTabRenderable)
  )
    throw new Error("Expected Tabs Recipe Renderables");
  await act(async () => beta.select());
  expect(root.value).toBe("beta");
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  await act(async () => theme.setActive("smoke"));
  const surface = beta.getChildren()[0] as BoxRenderable;
  await setup.waitFor(() =>
    surface.backgroundColor.equals(parseColor("#123456")),
  );
  theme.setActive("terminal");
});
