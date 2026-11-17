/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
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

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Combobox recipe", () => {
  it("renders trigger and dropdown", async () => {
    setup = await testRender(
      () => (
        <Combobox id="combobox" open={true} value="react">
          <ComboboxTrigger id="trigger" placeholder="Select framework" />
          <ComboboxContent id="content">
            <ComboboxInput placeholder="Filter..." />
            <ComboboxList>
              <ComboboxEmpty>No framework found.</ComboboxEmpty>
              <ComboboxItem value="react">
                <text content="React" />
              </ComboboxItem>
              <ComboboxItem value="solid">
                <text content="Solid" />
              </ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ),
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
        <Combobox open={true}>
          <ComboboxTrigger />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem value="item">
                <text content="Item" />
              </ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ),
      { width: 40, height: 12 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
