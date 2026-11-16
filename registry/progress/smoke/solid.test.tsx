/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { Progress } from "./components/ui/progress";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Progress recipe", () => {
  it("owns presentation and accepts native overrides", async () => {
    setup = await testRender(
      () => (
        <Progress
          id="progress"
          backgroundColor="#123456"
          defaultValue={50}
          indicatorOptions={{ backgroundColor: "#ABCDEF", id: "indicator" }}
          width={40}
        />
      ),
      { width: 40, height: 3 },
    );
    await setup.renderOnce();

    const progress = setup.renderer.root.findDescendantById(
      "progress",
    ) as BoxRenderable;
    const indicator = setup.renderer.root.findDescendantById(
      "indicator",
    ) as BoxRenderable;
    expect(progress.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(indicator.backgroundColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(indicator.width).toBe(20);
  });

  it("restyles the rendered progress on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          primary: "#654321",
          surface: "#123456",
        },
      },
    });
    setup = await testRender(
      () => (
        <Progress
          id="themed"
          defaultValue={50}
          indicatorOptions={{ id: "themed-indicator" }}
          width={40}
        />
      ),
      { width: 40, height: 3 },
    );
    const progress = setup.renderer.root.findDescendantById(
      "themed",
    ) as BoxRenderable;
    const indicator = setup.renderer.root.findDescendantById(
      "themed-indicator",
    ) as BoxRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() =>
      progress.backgroundColor.equals(parseColor("#123456")),
    );

    expect(indicator.backgroundColor.equals(parseColor("#654321"))).toBe(true);
    theme.setActive("terminal");
  });
});
