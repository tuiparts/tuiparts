import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createInput } from "./components/ui/input";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Input recipe", () => {
  it("preserves native value mutation and commit order", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const events: string[] = [];
    const input = createInput(setup.renderer, {
      value: "A",
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });
    setup.renderer.root.add(input);
    input.focus();

    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter();

    expect(input.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: { foreground: "#123456", mutedForeground: "#654321" },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 5 });
    const input = createInput(setup.renderer, { placeholder: "Theme" });
    setup.renderer.root.add(input);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(input.textColor.equals(parseColor("#123456"))).toBe(true);
    expect(input.placeholderColor.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
    expect(input.textColor.equals(parseColor("#123456"))).toBe(false);
  });
});
