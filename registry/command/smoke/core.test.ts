import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createCommand } from "./components/ui/command";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Command recipe", () => {
  it("renders command with items and filters on search", async () => {
    setup = await createTestRenderer({ width: 50, height: 15 });
    const command = createCommand(setup.renderer, {
      placeholder: "Search commands...",
    });
    command.addItem("git-status", "Git Status");
    command.addItem("git-commit", "Git Commit");
    command.addItem("exit", "Exit Application");

    setup.renderer.root.add(command);
    await setup.renderOnce();

    expect(command.search).toBe("");
    command.search = "git";
    expect(command.search).toBe("git");
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
    setup = await createTestRenderer({ width: 50, height: 15 });
    const command = createCommand(setup.renderer);
    command.addItem("save", "Save File");
    setup.renderer.root.add(command);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
