/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  ButtonPressDetails,
  ButtonRenderable,
} from "@tuiparts/core/button";
import { act } from "react";
import { Button } from "./components/ui/button";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Button recipe runtime smoke", async () => {
  const presses: ButtonPressDetails[] = [];
  setup = await testRender(
    <box flexDirection="column">
      <Button
        id="active"
        intent="neutral"
        label="Run"
        onPress={(details) => presses.push(details)}
      />
      <Button
        id="disabled"
        disabled
        label="Wait"
        onPress={() => presses.push({ source: "imperative" })}
      />
    </box>,
    { width: 30, height: 5 },
  );
  const active = setup.renderer.root.findDescendantById(
    "active",
  ) as ButtonRenderable;
  const disabled = setup.renderer.root.findDescendantById(
    "disabled",
  ) as ButtonRenderable;

  await setup.renderOnce();
  expect(setup.captureCharFrame().split("\n")[0]?.includes("Run")).toBe(true);
  await act(async () => active.press());
  disabled.focus();
  disabled.press();
  expect(presses).toEqual([{ source: "imperative" }]);
  expect(disabled.focused).toBe(false);
});

test("restyles rendered buttons on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(<Button id="themed" label="Theme" />, {
    width: 30,
    height: 3,
  });
  const root = setup.renderer.root.findDescendantById(
    "themed",
  ) as ButtonRenderable;
  const surface = root.getChildren()[0] as BoxRenderable;

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() =>
    surface.backgroundColor.equals(parseColor("#123456")),
  );

  expect(setup.renderer.root.findDescendantById("themed")).toBe(root);
  await act(async () => {
    theme.setActive("terminal");
  });
});
