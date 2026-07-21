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
      <Tabs id="root" orientation="vertical">
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
  const alpha = setup.renderer.root.findDescendantById("alpha");
  const beta = setup.renderer.root.findDescendantById("beta");
  if (
    !(root instanceof TabsRootRenderable) ||
    !(alpha instanceof TabsTabRenderable) ||
    !(beta instanceof TabsTabRenderable)
  )
    throw new Error("Expected Tabs Recipe Renderables");
  await setup.waitFor(() => beta.y > alpha.y);
  expect(beta.y).toBeGreaterThan(alpha.y);
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

test("horizontal default lays Tabs in a row and flexDirection overrides it", async () => {
  setup = await testRender(
    () => (
      <Tabs id="root">
        <TabsList>
          <TabsTrigger id="alpha" label="Alpha" value="alpha" />
          <TabsTrigger id="beta" label="Beta" value="beta" />
        </TabsList>
        <TabsContent value="alpha" />
      </Tabs>
    ),
    { width: 40, height: 6 },
  );
  const alpha = setup.renderer.root.findDescendantById("alpha");
  const beta = setup.renderer.root.findDescendantById("beta");
  if (
    !(alpha instanceof TabsTabRenderable) ||
    !(beta instanceof TabsTabRenderable)
  )
    throw new Error("Expected Tabs Recipe Renderables");
  await setup.waitFor(() => beta.x > alpha.x);
  expect(beta.x).toBeGreaterThan(alpha.x);
  expect(beta.y).toBe(alpha.y);
  setup.renderer.destroy();

  setup = await testRender(
    () => (
      <Tabs id="root">
        <TabsList flexDirection="column">
          <TabsTrigger id="gamma" label="Gamma" value="gamma" />
          <TabsTrigger id="delta" label="Delta" value="delta" />
        </TabsList>
        <TabsContent value="gamma" />
      </Tabs>
    ),
    { width: 40, height: 6 },
  );
  const gamma = setup.renderer.root.findDescendantById("gamma");
  const delta = setup.renderer.root.findDescendantById("delta");
  if (
    !(gamma instanceof TabsTabRenderable) ||
    !(delta instanceof TabsTabRenderable)
  )
    throw new Error("Expected Tabs Recipe Renderables");
  await setup.waitFor(() => delta.y > gamma.y);
  expect(delta.y).toBeGreaterThan(gamma.y);
});
