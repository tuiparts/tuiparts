import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createTerminalView } from "./components/ui/terminal-view";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core TerminalView recipe", () => {
  it("renders terminal frame with controls, lines, and prompt", async () => {
    setup = await createTestRenderer({ width: 50, height: 10 });
    const terminal = createTerminalView(setup.renderer, {
      title: "zsh",
      lines: ["Starting session...", "Ready."],
      prompt: "❯",
    });
    setup.renderer.root.add(terminal);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("● ● ●");
    expect(output).toContain("zsh");
    expect(output).toContain("Starting session...");
    expect(output).toContain("Ready.");
    expect(output).toContain("❯");
  });
});
