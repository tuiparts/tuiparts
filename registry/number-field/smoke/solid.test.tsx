/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  type NumberFieldRootRenderable,
} from "@tuiparts/core/number-field";
import { NumberField } from "./components/ui/number-field";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;
let field: NumberFieldRootRenderable | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
  field = undefined;
});

test("installed Solid NumberField recipe runtime smoke", async () => {
  setup = await testRender(
    () => (
      <NumberField
        defaultValue={2}
        label="Amount"
        ref={(value) => (field = value)}
      />
    ),
    { width: 30, height: 4 },
  );
  await setup.renderOnce();
  const row = field?.getChildren()[1];
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
  expect(field?.value).toBe(3);
  expect(input.value).toBe("3");
});

test("restyles the Solid scrub label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await testRender(
    () => <NumberField label="Amount" ref={(value) => (field = value)} />,
    { width: 30, height: 4 },
  );
  const label = field?.getChildren()[0]?.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected NumberField label TextRenderable");

  theme.setActive("smoke");
  await setup.waitFor(() => label.fg.equals(parseColor("#123456")));
  theme.setActive("terminal");
});
