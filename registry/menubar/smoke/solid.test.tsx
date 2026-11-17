/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Menubar recipe", () => {
  it("renders menubar and active content", async () => {
    setup = await testRender(
      () => (
        <Menubar id="menubar" value="file">
          <MenubarMenu value="file">
            <MenubarTrigger id="file-trigger">File</MenubarTrigger>
            <MenubarContent id="file-content">
              <MenubarGroup>
                <MenubarItem id="item-new">
                  <text content="New Window" />
                  <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarCheckboxItem id="item-check" checked={true}>
                  <text content="Always Show Full URLs" />
                </MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarRadioGroup value="profiles">
                  <MenubarRadioItem
                    id="item-radio"
                    value="personal"
                    checked={true}
                  >
                    <text content="Personal" />
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ),
      { width: 50, height: 12 },
    );
    await setup.renderOnce();

    const menubar = setup.renderer.root.findDescendantById(
      "menubar",
    ) as BoxRenderable;
    const trigger = setup.renderer.root.findDescendantById(
      "file-trigger",
    ) as BoxRenderable;
    const content = setup.renderer.root.findDescendantById(
      "file-content",
    ) as BoxRenderable;

    expect(menubar).toBeDefined();
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
        <Menubar value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <text content="Exit" />
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ),
      { width: 50, height: 12 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
