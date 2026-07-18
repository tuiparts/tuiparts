/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { InputRenderable } from "@tuiparts/core/input";
import { act, createRef } from "react";
import { Input } from "./components/ui/input";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Input recipe", () => {
  it("routes native events once", async () => {
    const events: string[] = [];
    const ref = createRef<InputRenderable>();
    setup = await testRender(
      <Input
        ref={ref}
        value="A"
        onInput={(value) => events.push(`input:${value}`)}
        onChange={(value) => events.push(`change:${value}`)}
        onSubmit={(value) => events.push(`submit:${value}`)}
      />,
      { width: 30, height: 5 },
    );
    await act(async () => ref.current?.focus());
    await act(async () => setup?.mockInput.typeText("B"));
    await act(async () => setup?.mockInput.pressEnter());

    expect(ref.current?.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);
  });

  it("restyles the rendered input on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
    setup = await testRender(<Input id="themed" placeholder="Theme" />, {
      width: 30,
      height: 5,
    });
    const input = setup.renderer.root.findDescendantById(
      "themed",
    ) as InputRenderable;

    await act(async () => {
      theme.setActive("smoke");
    });
    await setup.waitFor(() => input.textColor.equals(parseColor("#123456")));

    expect(setup.renderer.root.findDescendantById("themed")).toBe(input);
    await act(async () => {
      theme.setActive("terminal");
    });
  });
});
