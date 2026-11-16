import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createAspectRatio } from "./components/ui/aspect-ratio";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core AspectRatio recipe", () => {
  it("creates box with aspect ratio constraint", async () => {
    setup = await createTestRenderer({ width: 32, height: 18 });
    const ratioBox = createAspectRatio(setup.renderer, {
      id: "ratio",
      ratio: 16 / 9,
      width: 16,
    });
    setup.renderer.root.add(ratioBox);
    await setup.renderOnce();

    expect(ratioBox.ratio).toBeCloseTo(16 / 9, 2);
    expect(ratioBox.height).toBe(9);
  });
});
