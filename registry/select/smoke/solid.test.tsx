/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Select recipe", () => {
  it("renders trigger and content", async () => {
    setup = await testRender(
      () => (
        <Select value="apple">
          <SelectTrigger id="trigger">
            <SelectValue placeholder="Pick fruit" />
          </SelectTrigger>
          <SelectContent id="content">
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      ),
      { width: 30, height: 8 },
    );
    await setup.renderOnce();

    const trigger = setup.renderer.root.findDescendantById(
      "trigger",
    ) as BoxRenderable;
    expect(trigger).toBeDefined();
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          primary: "#654321",
          foreground: "#FEDCBA",
        },
      },
    });
    setup = await testRender(
      () => (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Theme Select" />
          </SelectTrigger>
        </Select>
      ),
      { width: 30, height: 5 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
