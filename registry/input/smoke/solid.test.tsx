/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { InputPrimitiveRenderable } from "@opentui-ui/core/input";
import { Input } from "./components/ui/input";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Input recipe", () => {
  it("routes native events once", async () => {
    const events: string[] = [];
    let input: InputPrimitiveRenderable | undefined;
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
});
