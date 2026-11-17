/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React DropdownMenu recipe renders trigger and menu content", async () => {
  setup = await testRender(
    <DropdownMenu id="menu" open={true}>
      <DropdownMenuTrigger id="trigger">Options</DropdownMenuTrigger>
      <DropdownMenuContent id="content">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem id="item-1">
            <text content="Profile" />
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem id="item-2" checked={true}>
            <text content="Show Status Bar" />
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioItem id="item-3" value="dark" checked={true}>
            <text content="Dark Theme" />
          </DropdownMenuRadioItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
    { width: 40, height: 12 },
  );
  await setup.renderOnce();

  const menu = setup.renderer.root.findDescendantById("menu") as BoxRenderable;
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
    <DropdownMenu open={true}>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <text content="Logout" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
    { width: 40, height: 12 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
