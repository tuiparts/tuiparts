/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./components/ui/command";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Command recipe renders input, group, and items", async () => {
  setup = await testRender(
    <Command id="cmd">
      <CommandInput placeholder="Type to filter..." />
      <CommandList>
        <CommandEmpty>No matching commands</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem id="item-1">
            <text content="Calendar" />
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem id="item-2">
            <text content="Calculator" />
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem id="item-3">
            <text content="Profile" />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
    { width: 50, height: 15 },
  );
  await setup.renderOnce();

  const cmd = setup.renderer.root.findDescendantById("cmd") as BoxRenderable;
  const item1 = setup.renderer.root.findDescendantById(
    "item-1",
  ) as BoxRenderable;

  expect(cmd).toBeDefined();
  expect(item1).toBeDefined();
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
    <Command>
      <CommandInput />
      <CommandList>
        <CommandItem>
          <text content="Run" />
        </CommandItem>
      </CommandList>
    </Command>,
    { width: 50, height: 15 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
