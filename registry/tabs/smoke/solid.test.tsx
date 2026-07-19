/** @jsxImportSource @opentui/solid */
import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { TabsRootRenderable, TabsTabRenderable } from "@tuiparts/core/tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid Tabs Recipe runtime smoke", async () => {
  setup = await testRender(
    () => (
      <Tabs id="root">
        <TabsList>
          <TabsTrigger id="alpha" label="Alpha" value="alpha" />
          <TabsTrigger id="beta" label="Beta" value="beta" />
        </TabsList>
        <TabsContent value="alpha" />
        <TabsContent value="beta" />
      </Tabs>
    ),
    { width: 40, height: 6 },
  );
  const root = setup.renderer.root.findDescendantById("root");
  const beta = setup.renderer.root.findDescendantById("beta");
  if (
    !(root instanceof TabsRootRenderable) ||
    !(beta instanceof TabsTabRenderable)
  )
    throw new Error("Expected Tabs Recipe Renderables");
  beta.select();
  expect(root.value).toBe("beta");
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  theme.setActive("smoke");
  const surface = beta.getChildren()[0] as BoxRenderable;
  await setup.waitFor(() =>
    surface.backgroundColor.equals(parseColor("#123456")),
  );
  theme.setActive("terminal");
});
