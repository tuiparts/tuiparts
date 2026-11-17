/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./components/ui/drawer";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Drawer recipe renders trigger and bottom docked content", async () => {
  setup = await testRender(
    <Drawer open={true}>
      <DrawerTrigger id="trigger">
        <text content="Open Drawer" />
      </DrawerTrigger>
      <DrawerContent id="content">
        <DrawerHeader>
          <DrawerTitle>Actions</DrawerTitle>
          <DrawerDescription>Select option</DrawerDescription>
        </DrawerHeader>
        <DrawerClose id="close">
          <text content="Close" />
        </DrawerClose>
      </DrawerContent>
    </Drawer>,
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
    <Drawer open={true}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Themed</DrawerTitle>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>,
    { width: 60, height: 20 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
