/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  ButtonPressDetails,
  ButtonRootRenderable,
} from "@opentui-ui/core/button";
import { act } from "react";
import { Button } from "./components/ui/button";

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
  ) as ButtonRootRenderable;
  const disabled = setup.renderer.root.findDescendantById(
    "disabled",
  ) as ButtonRootRenderable;

  await setup.renderOnce();
  expect(setup.captureCharFrame().split("\n")[0]?.includes("Run")).toBe(true);
  await act(async () => active.press());
  disabled.focus();
  disabled.press();
  expect(presses).toEqual([{ source: "imperative" }]);
  expect(disabled.focused).toBe(false);
});
