/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BoxRenderable, parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { Separator } from "./components/ui/separator";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Separator renders horizontal line by default", async () => {
  setup = await testRender(
    <Separator id="sep-h" borderColor="#ABCDEF" width={10} />,
    { width: 10, height: 2 },
  );
  await setup.renderOnce();

  const sep = setup.renderer.root.findDescendantById("sep-h") as BoxRenderable;
  expect(sep).toBeDefined();
  expect(sep.borderColor.toInts()).toEqual([171, 205, 239, 255]);
  expect(sep.border).toEqual(["top"]);
  expect(setup.captureCharFrame().split("\n")[0]).toBe("──────────");
});

test("installed React Separator renders vertical line", async () => {
  setup = await testRender(
    <Separator
      id="sep-v"
      borderColor="#ABCDEF"
      height={3}
      orientation="vertical"
    />,
    { width: 3, height: 3 },
  );
  await setup.renderOnce();

  const sep = setup.renderer.root.findDescendantById("sep-v") as BoxRenderable;
  expect(sep).toBeDefined();
  expect(sep.border).toEqual(["left"]);
  expect(setup.captureCharFrame()).toBe("│  \n│  \n│  \n");
});

test("restyles the rendered Separator on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        border: "#123456",
      },
    },
  });
  setup = await testRender(<Separator id="themed" width={5} />, {
    width: 5,
    height: 1,
  });
  const sep = setup.renderer.root.findDescendantById("themed") as BoxRenderable;

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() => sep.borderColor.equals(parseColor("#123456")));

  expect(sep.borderColor.equals(parseColor("#123456"))).toBe(true);

  await act(async () => {
    theme.setActive("terminal");
  });
});
