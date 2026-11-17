import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createDrawer } from "./components/ui/drawer";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Drawer recipe", () => {
  it("renders drawer with backdrop and docked bottom panel", async () => {
    setup = await createTestRenderer({ width: 60, height: 20 });
    const drawer = createDrawer(setup.renderer, {
      open: true,
      title: "Settings Drawer",
      description: "Quick configurations",
    });
    setup.renderer.root.add(drawer);
    await setup.renderOnce();

    expect(drawer.open).toBe(true);
    expect(drawer.titleText?.plainText).toBe("Settings Drawer");
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
    const drawer = createDrawer(setup.renderer, {
      open: true,
      title: "Themed Drawer",
    });
    setup.renderer.root.add(drawer);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
