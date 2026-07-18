import { afterEach, expect, test } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { theme } from "./components/ui/theme";
import {
  createToggleGroup,
  createToggleGroupItem,
} from "./components/ui/toggle-group";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core ToggleGroup recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 30, height: 3 });
  const group = createToggleGroup(setup.renderer);
  const left = createToggleGroupItem(setup.renderer, group.store, {
    label: "Left",
    value: "left",
  });
  group.add(left);
  setup.renderer.root.add(group);
  await setup.renderOnce();
  left.press();
  expect(group.value).toEqual(["left"]);
});

test("restyles from the theme store on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await createTestRenderer({ width: 30, height: 3 });
  const group = createToggleGroup(setup.renderer);
  const left = createToggleGroupItem(setup.renderer, group.store, {
    label: "Left",
    value: "left",
  });
  group.add(left);
  setup.renderer.root.add(group);
  await setup.renderOnce();
  left.press();
  expect(group.value).toEqual(["left"]);

  theme.setActive("smoke");
  expect(left.backgroundColor.equals(parseColor("#123456"))).toBe(true);

  theme.setActive("terminal");
  expect(left.backgroundColor.equals(parseColor("#123456"))).toBe(false);
});
