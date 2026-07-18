import { afterEach, describe, expect, it } from "bun:test";
import {
  type BoxRenderable,
  parseColor,
  type TextRenderable,
} from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSwitch } from "./components/ui/switch";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function firstLine(): string {
  return setup?.captureCharFrame().split("\n")[0]?.trimEnd() ?? "";
}

describe("installed Core Switch recipe", () => {
  it("owns uncontrolled behavior and consumer-chosen presentation", async () => {
    const changes: boolean[] = [];
    setup = await createTestRenderer({ width: 30, height: 3 });
    const toggle = createSwitch(setup.renderer, {
      density: "comfortable",
      label: "Ready",
      symbols: "ascii",
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();

    expect(firstLine()).toBe("*----  Ready");
    toggle.press();
    await setup.renderOnce();

    expect(toggle.checked).toBe(true);
    expect(changes).toEqual([true]);
    expect(firstLine()).toBe("----*  Ready");
  });

  it("reports controlled intent and suppresses disabled interaction", async () => {
    const changes: boolean[] = [];
    setup = await createTestRenderer({ width: 30, height: 3 });
    const toggle = createSwitch(setup.renderer, {
      checked: false,
      disabled: true,
      label: "Disabled",
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(toggle);

    toggle.focus();
    toggle.press();
    expect(toggle.focused).toBe(false);
    expect(toggle.checked).toBe(false);
    expect(changes).toEqual([]);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: { primary: "#123456" },
        glyphs: { thumb: "@", track: "=" },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const toggle = createSwitch(setup.renderer, { label: "Theme" });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();
    expect(firstLine()).toBe("●── Theme");

    theme.setActive("smoke");
    await setup.renderOnce();
    expect(firstLine()).toBe("@== Theme");
    const track = toggle.getChildren()[0] as BoxRenderable;
    const thumb = track.getChildren()[1] as BoxRenderable;
    const thumbText = thumb.getChildren()[0] as TextRenderable;
    expect(thumbText.fg.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    await setup.renderOnce();
    expect(firstLine()).toBe("●── Theme");
  });
});
