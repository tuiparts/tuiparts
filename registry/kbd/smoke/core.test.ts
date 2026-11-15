import { afterEach, describe, expect, it } from "bun:test";
import { parseColor, type TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createKbd, createKbdGroup } from "./components/ui/kbd";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Kbd recipe", () => {
  it("renders with keys or label and accepts native local overrides", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const kbd = createKbd(setup.renderer, {
      backgroundColor: "#123456",
      keys: ["Ctrl", "K"],
      labelOptions: { fg: "#ABCDEF" },
    });
    setup.renderer.root.add(kbd);
    await setup.renderOnce();

    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      " Ctrl+K   ",
    );
    expect(kbd.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    const label = kbd.getChildren()[0] as TextRenderable;
    expect(label.plainText).toBe("Ctrl+K");
    expect(label.fg.toInts()).toEqual([171, 205, 239, 255]);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          mutedForeground: "#654321",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const kbd = createKbd(setup.renderer, { label: "Enter" });
    setup.renderer.root.add(kbd);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(kbd.backgroundColor.equals(parseColor("#123456"))).toBe(true);
    const label = kbd.getChildren()[0] as TextRenderable;
    expect(label.fg.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
    expect(kbd.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });

  it("renders KbdGroup with multiple key shortcuts", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const group = createKbdGroup(setup.renderer);
    const kbd1 = createKbd(setup.renderer, { label: "Ctrl" });
    const kbd2 = createKbd(setup.renderer, { label: "K" });
    group.add(kbd1);
    group.add(kbd2);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 12)).toBe(
      " Ctrl   K   ",
    );
  });
});
