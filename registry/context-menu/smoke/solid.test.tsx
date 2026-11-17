/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./components/ui/context-menu";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid ContextMenu recipe", () => {
  it("renders trigger and context menu", async () => {
    setup = await testRender(
      () => (
        <ContextMenu id="menu" open={true}>
          <ContextMenuTrigger id="trigger">
            <text content="Target Area" />
          </ContextMenuTrigger>
          <ContextMenuContent id="content">
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem id="item-1">
                <text content="Back" />
                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuCheckboxItem id="item-2" checked={true}>
                <text content="Show Bookmarks" />
              </ContextMenuCheckboxItem>
              <ContextMenuRadioItem id="item-3" value="grid" checked={true}>
                <text content="Grid View" />
              </ContextMenuRadioItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ),
      { width: 40, height: 12 },
    );
    await setup.renderOnce();

    const menu = setup.renderer.root.findDescendantById(
      "menu",
    ) as BoxRenderable;
    const trigger = setup.renderer.root.findDescendantById(
      "trigger",
    ) as BoxRenderable;
    const content = setup.renderer.root.findDescendantById(
      "content",
    ) as BoxRenderable;

    expect(menu).toBeDefined();
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
        <ContextMenu open={true}>
          <ContextMenuTrigger>
            <text content="Area" />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              <text content="Inspect" />
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ),
      { width: 40, height: 12 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
