import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import type { ButtonPressDetails } from "@opentui-ui/core/button";
import { createButton } from "./components/ui/button";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Button recipe", () => {
  it("keeps presentation local while packaged behavior reports activation", async () => {
    const presses: ButtonPressDetails[] = [];
    setup = await createTestRenderer({ width: 30, height: 3 });
    const button = createButton(setup.renderer, {
      label: "Run",
      onPress: (details) => presses.push(details),
      size: "comfortable",
    });
    setup.renderer.root.add(button);
    await setup.renderOnce();

    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 7)).toBe(
      "  Run  ",
    );
    button.press();
    expect(presses).toEqual([{ source: "imperative" }]);
  });

  it("suppresses disabled focus and activation", async () => {
    let presses = 0;
    setup = await createTestRenderer({ width: 30, height: 3 });
    const button = createButton(setup.renderer, {
      disabled: true,
      label: "Wait",
      onPress: () => presses++,
    });
    setup.renderer.root.add(button);

    button.focus();
    button.press();
    expect(button.focused).toBe(false);
    expect(presses).toBe(0);
  });
});
