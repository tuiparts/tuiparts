import { afterEach, expect, test } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createTabs,
  createTabsList,
  createTabsPanel,
  createTabsTab,
} from "./components/ui/tabs";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core Tabs Recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 40, height: 6 });
  const root = createTabs(setup.renderer, { orientation: "vertical" });
  const list = createTabsList(setup.renderer, root);
  const alpha = createTabsTab(setup.renderer, root, {
    label: "Alpha",
    value: "alpha",
  });
  const beta = createTabsTab(setup.renderer, root, {
    label: "Beta",
    value: "beta",
  });
  list.add(alpha);
  list.add(beta);
  root.add(list);
  root.add(createTabsPanel(setup.renderer, root, { value: "alpha" }));
  root.add(createTabsPanel(setup.renderer, root, { value: "beta" }));
  setup.renderer.root.add(root);
  await setup.renderOnce();
  expect(beta.y).toBeGreaterThan(alpha.y);
  beta.select();
  expect(root.value).toBe("beta");

  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  theme.setActive("smoke");
  expect(beta.backgroundColor.equals(parseColor("#123456"))).toBe(true);
  theme.setActive("terminal");
});

test("horizontal default lays Tabs in a row and flexDirection overrides it", async () => {
  setup = await createTestRenderer({ width: 40, height: 6 });
  const root = createTabs(setup.renderer);
  const list = createTabsList(setup.renderer, root);
  const alpha = createTabsTab(setup.renderer, root, {
    label: "Alpha",
    value: "alpha",
  });
  const beta = createTabsTab(setup.renderer, root, {
    label: "Beta",
    value: "beta",
  });
  list.add(alpha);
  list.add(beta);
  root.add(list);
  setup.renderer.root.add(root);
  await setup.renderOnce();
  expect(beta.x).toBeGreaterThan(alpha.x);
  expect(beta.y).toBe(alpha.y);
  setup.renderer.destroy();

  setup = await createTestRenderer({ width: 40, height: 6 });
  const overriddenRoot = createTabs(setup.renderer);
  const overriddenList = createTabsList(setup.renderer, overriddenRoot, {
    flexDirection: "column",
  });
  const gamma = createTabsTab(setup.renderer, overriddenRoot, {
    label: "Gamma",
    value: "gamma",
  });
  const delta = createTabsTab(setup.renderer, overriddenRoot, {
    label: "Delta",
    value: "delta",
  });
  overriddenList.add(gamma);
  overriddenList.add(delta);
  overriddenRoot.add(overriddenList);
  setup.renderer.root.add(overriddenRoot);
  await setup.renderOnce();
  expect(delta.y).toBeGreaterThan(gamma.y);
});
