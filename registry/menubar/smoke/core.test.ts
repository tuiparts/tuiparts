import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createMenubar } from "./components/ui/menubar";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Menubar recipe", () => {
  it("renders menubar and menus", async () => {
    setup = await createTestRenderer({ width: 50, height: 12 });
    const menubar = createMenubar(setup.renderer, {
      menus: [
        {
          id: "file",
          label: "File",
          items: [
            { label: "New", shortcut: "⌘N" },
            { label: "Open", shortcut: "⌘O" },
          ],
        },
        {
          id: "edit",
          label: "Edit",
          items: [{ label: "Undo", shortcut: "⌘Z" }],
        },
      ],
    });

    setup.renderer.root.add(menubar);
    await setup.renderOnce();

    expect(menubar.activeMenuIndex).toBe(0);
    expect(menubar.isOpen).toBe(false);

    menubar.isOpen = true;
    expect(menubar.isOpen).toBe(true);
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
    setup = await createTestRenderer({ width: 50, height: 12 });
    const menubar = createMenubar(setup.renderer, {
      menus: [{ id: "file", label: "File", items: [{ label: "Exit" }] }],
    });
    setup.renderer.root.add(menubar);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
