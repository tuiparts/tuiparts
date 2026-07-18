/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { InputRenderable } from "@tuiparts/core/input";
import { Input } from "./components/ui/input";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Input recipe", () => {
  it("routes native events once", async () => {
    const events: string[] = [];
    let input: InputRenderable | undefined;
    setup = await testRender(
      () => (
        <Input
          ref={(value) => {
            input = value;
          }}
          value="A"
          onInput={(value) => events.push(`input:${value}`)}
          onChange={(value) => events.push(`change:${value}`)}
          onSubmit={(value) => events.push(`submit:${value}`)}
        />
      ),
      { width: 30, height: 5 },
    );
    input?.focus();
    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter();

    expect(input?.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);
  });

  it("restyles the rendered input on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
    setup = await testRender(() => <Input id="themed" placeholder="Theme" />, {
      width: 30,
      height: 5,
    });
    const input = setup.renderer.root.findDescendantById(
      "themed",
    ) as InputRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() => input.textColor.equals(parseColor("#123456")));

    expect(setup.renderer.root.findDescendantById("themed")).toBe(input);
    theme.setActive("terminal");
  });
});
