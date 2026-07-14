/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { Badge } from "./components/ui/badge";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Badge recipe owns presentation and accepts native overrides", async () => {
  setup = await testRender(
    <Badge
      id="status"
      backgroundColor="#123456"
      intent="success"
      label="Stable"
      labelOptions={{ fg: "#ABCDEF" }}
      size="comfortable"
    />,
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
