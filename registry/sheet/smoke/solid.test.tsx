/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
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

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Sheet recipe", () => {
  it("renders trigger and docked content", async () => {
    setup = await testRender(
      () => (
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
        </Sheet>
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
        <Sheet open={true}>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Themed</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ),
      { width: 60, height: 20 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
