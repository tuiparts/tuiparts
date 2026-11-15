import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSkeleton } from "./components/ui/skeleton";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Skeleton recipe", () => {
  it("renders with dimensions and accepts native overrides", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const skeleton = createSkeleton(setup.renderer, {
      backgroundColor: "#123456",
      height: 2,
      width: 10,
    });
    setup.renderer.root.add(skeleton);
    await setup.renderOnce();

    expect(skeleton.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(skeleton.shouldFill).toBe(true);
    expect(skeleton.width).toBe(10);
    expect(skeleton.height).toBe(2);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 5 });
    const skeleton = createSkeleton(setup.renderer, { width: 10, height: 1 });
    setup.renderer.root.add(skeleton);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(skeleton.backgroundColor.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    expect(skeleton.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });

  it("supports disabling pulse animation via animate: false", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const skeleton = createSkeleton(setup.renderer, {
      width: 10,
      height: 1,
      animate: false,
    });
    setup.renderer.root.add(skeleton);
    await setup.renderOnce();

    expect(skeleton.opacity).toBe(1);
  });

  it("pulses opacity when animation is enabled", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const skeleton = createSkeleton(setup.renderer, {
      width: 10,
      height: 1,
      animate: true,
    });
    setup.renderer.root.add(skeleton);
    await setup.renderOnce();

    expect(skeleton.opacity).toBe(1);
    await new Promise((r) => setTimeout(r, 400));
    expect(skeleton.opacity).toBeLessThan(1);
    expect(skeleton.opacity).toBeGreaterThanOrEqual(0.4);
    skeleton.destroy();
  });
});
