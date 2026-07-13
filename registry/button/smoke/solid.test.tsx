/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  ButtonPressDetails,
  ButtonRootRenderable,
} from "@opentui-ui/core/button";
import { Button } from "./components/ui/button";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Button recipe", () => {
  it("keeps visuals editable while preserving packaged activation", async () => {
    const presses: ButtonPressDetails[] = [];
    setup = await testRender(
      () => (
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
            onPress={(details) => presses.push(details)}
          />
        </box>
      ),
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
    active.press();
    disabled.focus();
    disabled.press();
    expect(presses).toEqual([{ source: "imperative" }]);
    expect(disabled.focused).toBe(false);
  });
});
