/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { theme } from "./components/ui/theme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Tooltip recipe renders trigger and content", async () => {
  setup = await testRender(
    <TooltipProvider>
      <Tooltip open={true}>
        <TooltipTrigger id="trigger">
          <text content="Hover me" />
        </TooltipTrigger>
        <TooltipContent id="content" content="Tooltip info" />
      </Tooltip>
    </TooltipProvider>,
    { width: 30, height: 6 },
  );
  await setup.renderOnce();

  const trigger = setup.renderer.root.findDescendantById(
    "trigger",
  ) as BoxRenderable;
  const content = setup.renderer.root.findDescendantById(
    "content",
  ) as BoxRenderable;

  expect(trigger).toBeDefined();
  expect(content).toBeDefined();
});

test("restyles on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        surface: "#123456",
        border: "#654321",
        foreground: "#FEDCBA",
      },
    },
  });
  setup = await testRender(
    <Tooltip open={true}>
      <TooltipTrigger>
        <text content="Button" />
      </TooltipTrigger>
      <TooltipContent content="Hint" />
    </Tooltip>,
    { width: 30, height: 5 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
