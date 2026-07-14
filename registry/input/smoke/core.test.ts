import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createInput } from "./components/ui/input";

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
});
