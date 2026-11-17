import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createContextMenu } from "./components/ui/context-menu";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core ContextMenu recipe", () => {
  it("renders trigger area and context menu items", async () => {
    setup = await createTestRenderer({ width: 40, height: 12 });
    const menu = createContextMenu(setup.renderer, {
      triggerContent: "Right-click or press Return",
      open: true,
    });
    menu.addItem({ label: "Back", shortcut: "⌘[" });
    menu.addItem({ label: "Forward", shortcut: "⌘]" });
    menu.addItem({ label: "Reload", shortcut: "⌘R" });

    setup.renderer.root.add(menu);
    await setup.renderOnce();

    expect(menu.triggerText?.plainText).toBe("Right-click or press Return");
    expect(menu.open).toBe(true);
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
    setup = await createTestRenderer({ width: 40, height: 12 });
    const menu = createContextMenu(setup.renderer, { open: true });
    menu.addItem({ label: "Inspect" });
    setup.renderer.root.add(menu);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
