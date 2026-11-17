/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "./components/ui/combobox";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Combobox recipe renders trigger and dropdown", async () => {
  setup = await testRender(
    <Combobox id="combobox" open={true} value="react">
      <ComboboxTrigger id="trigger" placeholder="Select framework" />
      <ComboboxContent id="content">
        <ComboboxInput placeholder="Filter..." />
        <ComboboxList>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxItem value="react">React</ComboboxItem>
          <ComboboxItem value="solid">Solid</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
    { width: 40, height: 12 },
  );
  await setup.renderOnce();

  const combobox = setup.renderer.root.findDescendantById(
    "combobox",
  ) as BoxRenderable;
  const trigger = setup.renderer.root.findDescendantById(
    "trigger",
  ) as BoxRenderable;
  const content = setup.renderer.root.findDescendantById(
    "content",
  ) as BoxRenderable;

  expect(combobox).toBeDefined();
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
    <Combobox open={true}>
      <ComboboxTrigger />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem value="item">Item</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
    { width: 40, height: 12 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
