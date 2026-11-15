/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import {
  type BoxRenderable,
  parseColor,
  type TextRenderable,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { Kbd, KbdGroup } from "./components/ui/kbd";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Kbd recipe owns presentation and accepts native overrides", async () => {
  setup = await testRender(
    <Kbd
      id="shortcut"
      backgroundColor="#123456"
      keys={["Ctrl", "K"]}
      labelOptions={{ fg: "#ABCDEF" }}
    />,
    { width: 30, height: 3 },
  );
  await setup.renderOnce();

  const kbd = setup.renderer.root.findDescendantById(
    "shortcut",
  ) as BoxRenderable;
  const label = kbd.getChildren()[0] as TextRenderable;
  expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
    " Ctrl+K   ",
  );
  expect(kbd.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
  expect(label.plainText).toBe("Ctrl+K");
  expect(label.fg.toInts()).toEqual([171, 205, 239, 255]);
});

test("restyles the rendered kbd on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        surface: "#123456",
        mutedForeground: "#654321",
      },
    },
  });
  setup = await testRender(<Kbd id="themed" label="Enter" />, {
    width: 30,
    height: 3,
  });
  const kbd = setup.renderer.root.findDescendantById("themed") as BoxRenderable;

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() => kbd.backgroundColor.equals(parseColor("#123456")));

  expect(setup.renderer.root.findDescendantById("themed")).toBe(kbd);
  await act(async () => {
    theme.setActive("terminal");
  });
});

test("renders KbdGroup with multiple keys", async () => {
  setup = await testRender(
    <KbdGroup id="group">
      <Kbd label="Ctrl" />
      <Kbd label="K" />
    </KbdGroup>,
    { width: 30, height: 3 },
  );
  await setup.renderOnce();

  expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 12)).toBe(
    " Ctrl   K   ",
  );
});
