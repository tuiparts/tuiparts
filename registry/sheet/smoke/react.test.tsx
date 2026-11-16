/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Sheet recipe renders trigger and docked content", async () => {
  setup = await testRender(
    <Sheet open={true}>
      <SheetTrigger id="trigger">
        <text content="Open Menu" />
      </SheetTrigger>
      <SheetContent id="content" side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Browse sections</SheetDescription>
        </SheetHeader>
        <SheetClose id="close">
          <text content="Close" />
        </SheetClose>
      </SheetContent>
    </Sheet>,
    { width: 60, height: 20 },
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
        mutedForeground: "#888888",
      },
    },
  });
  setup = await testRender(
    <Sheet open={true}>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Themed</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>,
    { width: 60, height: 20 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
