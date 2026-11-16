/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ScrollArea } from "./components/ui/scroll-area";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid ScrollArea recipe runtime smoke", () => {
  it("renders scrollbox with scrollable content", async () => {
    setup = await testRender(
      () => (
        <ScrollArea height={6} id="test-scroll" width={30}>
          <box flexDirection="column">
            <text content="Item 0" />
            <text content="Item 1" />
            <text content="Item 2" />
          </box>
        </ScrollArea>
      ),
      { width: 30, height: 6 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("Item 0")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { border: "#123456" } } });
    setup = await testRender(
      () => (
        <ScrollArea height={6} id="themed-scroll" width={30}>
          <text content="Content" />
        </ScrollArea>
      ),
      { width: 30, height: 6 },
    );
    theme.setActive("smoke");
    await setup.renderOnce();
    theme.setActive("terminal");
  });
});
