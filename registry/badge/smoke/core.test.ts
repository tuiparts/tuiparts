import { afterEach, describe, expect, it } from "bun:test";
import { parseColor, type TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createBadge } from "./components/ui/badge";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Badge recipe", () => {
  it("owns content, intent, size, and native local overrides", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const badge = createBadge(setup.renderer, {
      backgroundColor: "#123456",
      intent: "success",
      label: "Stable",
      labelOptions: { fg: "#ABCDEF" },
      size: "comfortable",
    });
    setup.renderer.root.add(badge);
    await setup.renderOnce();

    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      "  Stable  ",
    );
    expect(badge.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    const label = badge.getChildren()[0] as TextRenderable;
    expect(label.fg.toInts()).toEqual([171, 205, 239, 255]);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          foreground: "#654321",
          warning: "#ABCDEF",
          warningForeground: "#FEDCBA",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const badge = createBadge(setup.renderer, { label: "Theme" });
    const alert = createBadge(setup.renderer, {
      intent: "warning",
      label: "Warn",
    });
    setup.renderer.root.add(badge);
    setup.renderer.root.add(alert);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(badge.backgroundColor.equals(parseColor("#123456"))).toBe(true);
    const label = badge.getChildren()[0] as TextRenderable;
    expect(label.fg.equals(parseColor("#654321"))).toBe(true);
    expect(alert.backgroundColor.equals(parseColor("#ABCDEF"))).toBe(true);
    const alertLabel = alert.getChildren()[0] as TextRenderable;
    expect(alertLabel.fg.equals(parseColor("#FEDCBA"))).toBe(true);

    theme.setActive("terminal");
    expect(badge.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });
});
