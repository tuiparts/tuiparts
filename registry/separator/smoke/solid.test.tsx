/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { Separator } from "./components/ui/separator";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Separator recipe", () => {
  it("renders horizontal line by default", async () => {
    setup = await testRender(
      () => <Separator id="sep-h" borderColor="#ABCDEF" width={10} />,
      { width: 10, height: 2 },
    );
    await setup.renderOnce();

    const sep = setup.renderer.root.findDescendantById(
      "sep-h",
    ) as BoxRenderable;
    expect(sep).toBeDefined();
    expect(sep.borderColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(sep.border).toEqual(["top"]);
    expect(setup.captureCharFrame().split("\n")[0]).toBe("──────────");
  });

  it("renders vertical line", async () => {
    setup = await testRender(
      () => (
        <Separator
          id="sep-v"
          borderColor="#ABCDEF"
          height={3}
          orientation="vertical"
        />
      ),
      { width: 3, height: 3 },
    );
    await setup.renderOnce();

    const sep = setup.renderer.root.findDescendantById(
      "sep-v",
    ) as BoxRenderable;
    expect(sep).toBeDefined();
    expect(sep.border).toEqual(["left"]);
    expect(setup.captureCharFrame()).toBe("│  \n│  \n│  \n");
  });

  it("restyles the rendered Separator on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
        },
      },
    });
    setup = await testRender(() => <Separator id="themed" width={5} />, {
      width: 5,
      height: 1,
    });
    const sep = setup.renderer.root.findDescendantById(
      "themed",
    ) as BoxRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() => sep.borderColor.equals(parseColor("#123456")));

    expect(sep.borderColor.equals(parseColor("#123456"))).toBe(true);
    theme.setActive("terminal");
  });
});
