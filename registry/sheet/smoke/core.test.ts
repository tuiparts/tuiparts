import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSheet } from "./components/ui/sheet";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Sheet recipe", () => {
  it("renders sheet with backdrop and docked content", async () => {
    setup = await createTestRenderer({ width: 60, height: 20 });
    const sheet = createSheet(setup.renderer, {
      side: "right",
      open: true,
      title: "Navigation",
      description: "App routes",
    });
    setup.renderer.root.add(sheet);
    await setup.renderOnce();

    expect(sheet.open).toBe(true);
    expect(sheet.side).toBe("right");
    expect(sheet.titleText?.plainText).toBe("Navigation");
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          border: "#654321",
          foreground: "#FEDCBA",
          mutedForeground: "#888888",
        },
      },
    });
    setup = await createTestRenderer({ width: 60, height: 20 });
    const sheet = createSheet(setup.renderer, {
      open: true,
      title: "Themed Sheet",
    });
    setup.renderer.root.add(sheet);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
