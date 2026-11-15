/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { TerminalView } from "./components/ui/terminal-view";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid TerminalView recipe", () => {
  it("renders terminal window", async () => {
    setup = await testRender(
      () => (
        <TerminalView
          title="zsh"
          lines={["Starting session...", "Ready."]}
          prompt="❯"
          width={50}
          height={10}
        />
      ),
      { width: 50, height: 10 },
    );
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("● ● ●");
    expect(output).toContain("zsh");
    expect(output).toContain("Starting session...");
    expect(output).toContain("Ready.");
    expect(output).toContain("❯");
  });
});
