/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { theme } from "./components/ui/theme";
import { useTheme } from "./components/ui/use-theme";
import { ascii } from "./themes/ascii";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
  theme.override(undefined);
  theme.setActive("terminal");
});

describe("installed Solid theme recipe", () => {
  it("restyles live components on theme switch", async () => {
    theme.register("ascii", ascii);
    setup = await testRender(
      () => {
        const tokens = useTheme();
        return <text id="mark" content={tokens().glyphs.check} />;
      },
      { width: 10, height: 3 },
    );
    const mark = setup.renderer.root.findDescendantById(
      "mark",
    ) as TextRenderable;
    expect(mark.plainText).toBe("✓");

    theme.setActive("ascii");
    await setup.waitFor(() => mark.plainText === "x");

    expect(setup.renderer.root.findDescendantById("mark")).toBe(mark);
  });
});
