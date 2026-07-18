import { afterEach, expect, test } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { theme } from "./components/ui/theme";
import { createToggle } from "./components/ui/toggle";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core Toggle recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 20, height: 3 });
  const toggle = createToggle(setup.renderer, { label: "Bold" });
  setup.renderer.root.add(toggle);
  await setup.renderOnce();
  toggle.press();
  expect(toggle.pressed).toBe(true);
  expect(setup.captureCharFrame().includes("Bold")).toBe(true);
});

test("restyles from the theme store on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await createTestRenderer({ width: 20, height: 3 });
  const toggle = createToggle(setup.renderer, {
    defaultPressed: true,
    label: "Theme",
  });
  setup.renderer.root.add(toggle);
  await setup.renderOnce();

  theme.setActive("smoke");
  expect(toggle.backgroundColor.equals(parseColor("#123456"))).toBe(true);

  theme.setActive("terminal");
  expect(toggle.backgroundColor.equals(parseColor("#123456"))).toBe(false);
});
