/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { AspectRatio } from "./components/ui/aspect-ratio";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React AspectRatio recipe runtime smoke", () => {
  it("renders container with aspect ratio constraint", async () => {
    setup = await testRender(
      <AspectRatio id="ratio-box" ratio={16 / 9} width={16}>
        <box id="inner" />
      </AspectRatio>,
      { width: 32, height: 18 },
    );
    await setup.renderOnce();

    const box = setup.renderer.root.findDescendantById(
      "ratio-box",
    ) as BoxRenderable;
    expect(box).toBeDefined();
    expect(box.height).toBe(9);
  });
});
