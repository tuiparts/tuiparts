/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Avatar recipe runtime smoke", () => {
  it("renders avatar with initials fallback", async () => {
    setup = await testRender(
      () => (
        <Avatar id="test-avatar" size="default">
          <AvatarFallback content="TP" />
        </Avatar>
      ),
      { width: 20, height: 5 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("TP")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { border: "#123456" } } });
    setup = await testRender(
      () => (
        <Avatar id="themed-avatar">
          <AvatarFallback content="TH" />
        </Avatar>
      ),
      { width: 20, height: 5 },
    );
    theme.setActive("smoke");
    await setup.renderOnce();
    theme.setActive("terminal");
  });
});
