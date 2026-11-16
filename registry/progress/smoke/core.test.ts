import { afterEach, describe, expect, it } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createProgress } from "./components/ui/progress";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Progress recipe", () => {
  it("renders with defaultValue, computes indicator width, and accepts native overrides", async () => {
    setup = await createTestRenderer({ width: 40, height: 3 });
    const progress = createProgress(setup.renderer, {
      backgroundColor: "#123456",
      defaultValue: 50,
      indicatorOptions: { backgroundColor: "#ABCDEF" },
      width: 40,
    });
    setup.renderer.root.add(progress);
    await setup.renderOnce();

    expect(progress.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(progress.value).toBe(50);
    const indicator = progress.getChildren()[0] as BoxRenderable;
    expect(indicator).toBeDefined();
    expect(indicator.backgroundColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(indicator.width).toBe(20);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          primary: "#654321",
          surface: "#123456",
        },
      },
    });
    setup = await createTestRenderer({ width: 40, height: 3 });
    const progress = createProgress(setup.renderer, {
      defaultValue: 50,
      width: 40,
    });
    setup.renderer.root.add(progress);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(progress.backgroundColor.equals(parseColor("#123456"))).toBe(true);
    const indicator = progress.getChildren()[0] as BoxRenderable;
    expect(indicator.backgroundColor.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
    expect(progress.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });
});
