/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import {
  type BoxRenderable,
  parseColor,
  type TextRenderable,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { Badge } from "./components/ui/badge";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Badge recipe", () => {
  it("owns presentation and accepts native overrides", async () => {
    setup = await testRender(
      () => (
        <Badge
          id="status"
          backgroundColor="#123456"
          intent="success"
          label="Stable"
          labelOptions={{ fg: "#ABCDEF" }}
          size="comfortable"
        />
      ),
      { width: 30, height: 3 },
    );
    await setup.renderOnce();

    const badge = setup.renderer.root.findDescendantById(
      "status",
    ) as BoxRenderable;
    const label = badge.getChildren()[0] as TextRenderable;
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      "  Stable  ",
    );
    expect(badge.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(label.fg.toInts()).toEqual([171, 205, 239, 255]);
  });

  it("restyles the rendered badge on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { surface: "#123456" } } });
    setup = await testRender(() => <Badge id="themed" label="Theme" />, {
      width: 30,
      height: 3,
    });
    const badge = setup.renderer.root.findDescendantById(
      "themed",
    ) as BoxRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() =>
      badge.backgroundColor.equals(parseColor("#123456")),
    );

    expect(setup.renderer.root.findDescendantById("themed")).toBe(badge);
    theme.setActive("terminal");
  });
});
