/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  NumberFieldRootRenderable,
} from "@tuiparts/core/number-field";
import { act } from "react";
import { NumberField } from "./components/ui/number-field";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React NumberField recipe runtime smoke", async () => {
  setup = await testRender(
    <NumberField id="field" defaultValue={2} label="Amount" />,
    { width: 30, height: 4 },
  );
  const field = setup.renderer.root.findDescendantById("field");
  if (!(field instanceof NumberFieldRootRenderable))
    throw new Error("Expected NumberField Root");
  const row = field.getChildren()[1];
  const input = row?.getChildren()[1];
  const increment = row?.getChildren()[2];
  if (!(input instanceof NumberFieldInputRenderable))
    throw new Error("Expected NumberField Input");
  if (!(increment instanceof NumberFieldIncrementRenderable))
    throw new Error("Expected NumberField Increment");

  await act(async () => increment.press());
  expect(field.value).toBe(3);
  expect(input.value).toBe("3");
});

test("restyles the React scrub label on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
  setup = await testRender(<NumberField id="themed" label="Amount" />, {
    width: 30,
    height: 4,
  });
  const field = setup.renderer.root.findDescendantById("themed");
  if (!(field instanceof NumberFieldRootRenderable))
    throw new Error("Expected NumberField Root");
  const label = field.getChildren()[0]?.getChildren()[0];
  if (!(label instanceof TextRenderable))
    throw new Error("Expected NumberField label TextRenderable");

  await act(async () => theme.setActive("smoke"));
  await setup.waitFor(() => label.fg.equals(parseColor("#123456")));
  await act(async () => theme.setActive("terminal"));
});
