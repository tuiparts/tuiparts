import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createBadge } from "./components/ui/badge";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Badge recipe", () => {
  it("owns content, intent, size, and native local overrides", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const badge = createBadge(setup.renderer, {
      backgroundColor: "#123456",
      intent: "success",
      label: "Stable",
      labelOptions: { fg: "#ABCDEF" },
      size: "comfortable",
    });
    setup.renderer.root.add(badge);
    await setup.renderOnce();

    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      "  Stable  ",
    );
    expect(badge.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    const label = badge.getChildren()[0] as TextRenderable;
    expect(label.fg.toInts()).toEqual([171, 205, 239, 255]);
  });
});
