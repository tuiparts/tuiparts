import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import type { ButtonPressDetails } from "@tuiparts/core/button";
import { createButton } from "./components/ui/button";
import { theme, tint } from "./components/ui/theme";

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

  it("derives a pressed shade distinct from the focus color", async () => {
    theme.register("smoke-pressed", {
      tokens: { colors: { focus: "#0000FF", foreground: "#FFFFFF" } },
    });
    theme.setActive("smoke-pressed");
    setup = await createTestRenderer({ width: 30, height: 3 });
    const button = createButton(setup.renderer, { label: "Press" });
    setup.renderer.root.add(button);

    button.focus();
    expect(button.backgroundColor.equals(parseColor("#0000FF"))).toBe(true);

    button.store.setPressed(true);
    expect(button.backgroundColor.equals(tint("#0000FF", "#FFFFFF", 0.3))).toBe(
      true,
    );
    expect(button.backgroundColor.equals(parseColor("#0000FF"))).toBe(false);

    theme.setActive("terminal");
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const button = createButton(setup.renderer, { label: "Theme" });
    setup.renderer.root.add(button);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(button.backgroundColor.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    expect(button.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });
});
