/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { parseColor, type TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { theme } from "./components/ui/theme";
import { useTheme } from "./components/ui/use-theme";
import { ascii } from "./themes/ascii";
import { cobaltDeep } from "./themes/cobalt-deep";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
  theme.override(undefined);
  theme.setActive("terminal");
});

function Mark() {
  const tokens = useTheme();
  return (
    <text id="mark" content={tokens.glyphs.check} fg={tokens.colors.primary} />
  );
}

test("installed React theme recipe restyles live components", async () => {
  theme.register("ascii", ascii);
  theme.register("cobalt-deep", cobaltDeep);
  setup = await testRender(<Mark />, { width: 10, height: 3 });
  const mark = setup.renderer.root.findDescendantById("mark") as TextRenderable;
  expect(mark.plainText).toBe("✓");

  await act(async () => {
    theme.setActive("ascii");
  });
  await setup.waitFor(() => mark.plainText === "x");

  await act(async () => {
    theme.setMode("dark");
    theme.setActive("cobalt-deep");
  });
  await setup.waitFor(() => mark.fg.equals(parseColor("#FFB000")));

  expect(setup.renderer.root.findDescendantById("mark")).toBe(mark);
});
