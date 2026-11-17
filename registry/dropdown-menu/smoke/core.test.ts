import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createDropdownMenu } from "./components/ui/dropdown-menu";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core DropdownMenu recipe", () => {
  it("renders trigger and popup items", async () => {
    setup = await createTestRenderer({ width: 40, height: 12 });
    const menu = createDropdownMenu(setup.renderer, {
      triggerLabel: "Options",
      open: true,
    });
    menu.addItem({ label: "Profile", shortcut: "⇧⌘P" });
    menu.addItem({ label: "Settings", shortcut: "⌘S" });

    setup.renderer.root.add(menu);
    await setup.renderOnce();

    expect(menu.triggerText.plainText).toBe("Options");
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
    const menu = createDropdownMenu(setup.renderer, { open: true });
    menu.addItem({ label: "Logout" });
    setup.renderer.root.add(menu);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
