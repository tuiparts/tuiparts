import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
} from "@tuiparts/core/number-field";
import { createNumberField } from "./components/ui/number-field";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core NumberField recipe runtime smoke", async () => {
  setup = await createTestRenderer({ width: 30, height: 4 });
  const field = createNumberField(setup.renderer, {
    defaultValue: 2,
    label: "Amount",
  });
  setup.renderer.root.add(field);
  await setup.renderOnce();

  const row = field.getChildren()[1];
  const decrement = row?.getChildren()[0];
  const input = row?.getChildren()[1];
  const increment = row?.getChildren()[2];
  if (!(decrement instanceof NumberFieldDecrementRenderable))
    throw new Error("Expected NumberField Decrement");
  if (!(input instanceof NumberFieldInputRenderable))
    throw new Error("Expected NumberField Input");
  if (!(increment instanceof NumberFieldIncrementRenderable))
    throw new Error("Expected NumberField Increment");

  expect(decrement.getChildren()[0]?.x).toBe(decrement.x + 1);
  expect(increment.getChildren()[0]?.x).toBe(increment.x + 1);
  increment.press();
  expect(field.value).toBe(3);
  expect(input.value).toBe("3");
});

test("restyles the Core scrub label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await createTestRenderer({ width: 30, height: 4 });
  const field = createNumberField(setup.renderer, { label: "Amount" });
  setup.renderer.root.add(field);
  await setup.renderOnce();

  const label = field.getChildren()[0]?.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected NumberField label TextRenderable");
  theme.setActive("smoke");
  expect(label.fg.equals(parseColor("#123456"))).toBe(true);
  theme.setActive("terminal");
});
