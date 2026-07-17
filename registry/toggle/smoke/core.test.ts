import { afterEach, expect, test } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
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
