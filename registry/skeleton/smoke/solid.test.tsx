/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { Skeleton } from "./components/ui/skeleton";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Skeleton recipe", () => {
  it("owns presentation and accepts native overrides", async () => {
    setup = await testRender(
      () => (
        <Skeleton
          id="placeholder"
          backgroundColor="#123456"
          height={2}
          width={10}
        />
      ),
      { width: 30, height: 5 },
    );
    await setup.renderOnce();

    const skeleton = setup.renderer.root.findDescendantById(
      "placeholder",
    ) as BoxRenderable;
    expect(skeleton.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(skeleton.shouldFill).toBe(true);
    expect(skeleton.width).toBe(10);
    expect(skeleton.height).toBe(2);
  });

  it("restyles the rendered skeleton on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
        },
      },
    });
    setup = await testRender(
      () => <Skeleton id="themed" height={1} width={10} />,
      { width: 30, height: 5 },
    );
    const skeleton = setup.renderer.root.findDescendantById(
      "themed",
    ) as BoxRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() =>
      skeleton.backgroundColor.equals(parseColor("#123456")),
    );

    expect(setup.renderer.root.findDescendantById("themed")).toBe(skeleton);
    theme.setActive("terminal");
  });

  it("supports disabling pulse animation via animate={false}", async () => {
    setup = await testRender(
      () => <Skeleton id="static-skel" height={1} width={10} animate={false} />,
      { width: 30, height: 5 },
    );
    await setup.renderOnce();

    const skeleton = setup.renderer.root.findDescendantById(
      "static-skel",
    ) as BoxRenderable;
    expect(skeleton.opacity).toBe(1);
  });
});
