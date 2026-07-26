import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createCheckboxGroup,
  createCheckboxGroupItem,
} from "./components/ui/checkbox-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core CheckboxGroup recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 30, height: 3 });
  const group = createCheckboxGroup(setup.renderer);
  const left = createCheckboxGroupItem(setup.renderer, group.store, {
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
  const group = createCheckboxGroup(setup.renderer);
  const left = createCheckboxGroupItem(setup.renderer, group.store, {
    label: "Left",
    value: "left",
  });
  group.add(left);
  setup.renderer.root.add(group);
  await setup.renderOnce();
  left.press();
  expect(group.value).toEqual(["left"]);

  theme.setActive("smoke");
  const indicator = left.getChildren()[0]?.getChildren()[0];
  const mark = indicator?.getChildren()[0];
  if (!(mark instanceof TextRenderable))
    throw new Error("Expected Checkbox mark TextRenderable");
  expect(mark.fg.equals(parseColor("#123456"))).toBe(true);

  theme.setActive("terminal");
  expect(mark.fg.equals(parseColor("#123456"))).toBe(false);
});
