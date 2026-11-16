/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Select recipe renders trigger and content", async () => {
  setup = await testRender(
    <Select value="apple">
      <SelectTrigger id="trigger">
        <SelectValue placeholder="Pick fruit" />
      </SelectTrigger>
      <SelectContent id="content">
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>,
    { width: 30, height: 8 },
  );
  await setup.renderOnce();

  const trigger = setup.renderer.root.findDescendantById(
    "trigger",
  ) as BoxRenderable;
  expect(trigger).toBeDefined();
});

test("restyles on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        border: "#123456",
        primary: "#654321",
        foreground: "#FEDCBA",
      },
    },
  });
  setup = await testRender(
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Theme Select" />
      </SelectTrigger>
    </Select>,
    { width: 30, height: 5 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
