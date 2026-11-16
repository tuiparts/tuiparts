/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
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

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Drawer recipe", () => {
  it("renders trigger and bottom docked content", async () => {
    setup = await testRender(
      () => (
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
        </Drawer>
      ),
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

  it("restyles on theme switch", async () => {
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
      () => (
        <Drawer open={true}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Themed</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      ),
      { width: 60, height: 20 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
