/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./components/ui/hover-card";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React HoverCard recipe renders trigger and content", async () => {
  setup = await testRender(
    <HoverCard open={true}>
      <HoverCardTrigger id="trigger">
        <text content="@username" />
      </HoverCardTrigger>
      <HoverCardContent id="content">
        <text content="User profile details" />
      </HoverCardContent>
    </HoverCard>,
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
    <HoverCard open={true}>
      <HoverCardTrigger>
        <text content="Hover" />
      </HoverCardTrigger>
      <HoverCardContent>
        <text content="Preview" />
      </HoverCardContent>
    </HoverCard>,
    { width: 30, height: 6 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
