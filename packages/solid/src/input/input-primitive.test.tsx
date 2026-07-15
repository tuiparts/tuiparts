/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { InputRenderable } from "@tuiparts/core/input";
import { createSignal } from "solid-js";
import { Input } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Input", () => {
  it("preserves native editing and event order without duplicate routing", async () => {
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

    expect(input?.value).toBe("A");
    expect(events).toEqual([]);
    input?.focus();
    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter();

    expect(input?.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);
  });

  it("applies programmatic values to the retained Renderable", async () => {
    const events: string[] = [];
    let input: InputRenderable | undefined;
    let update: (value: string) => void = () => {};
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal("Before");
        update = setValue;
        return (
          <Input
            ref={(next) => {
              input = next;
            }}
            value={value()}
            onInput={(next) => events.push(next)}
          />
        );
      },
      { width: 30, height: 5 },
    );
    const retained = input;

    update("After");
    await setup.waitFor(() => input?.value === "After");

    expect(input).toBe(retained);
    expect(events).toEqual(["After"]);
  });
});
