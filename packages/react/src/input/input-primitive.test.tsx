import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { InputRenderable } from "@tuiparts/core/input";
import { act, createElement, createRef, useState } from "react";
import { Input } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Input", () => {
  it("preserves native editing and event order without duplicate routing", async () => {
    const events: string[] = [];
    const ref = createRef<InputRenderable>();
    setup = await testRender(
      createElement(Input, {
        ref,
        value: "A",
        onInput: (value) => events.push(`input:${value}`),
        onChange: (value) => events.push(`change:${value}`),
        onSubmit: (value) => events.push(`submit:${value}`),
      }),
      { width: 30, height: 5 },
    );

    expect(ref.current?.value).toBe("A");
    expect(events).toEqual([]);
    await act(async () => ref.current?.focus());
    await act(async () => setup?.mockInput.typeText("B"));
    await act(async () => setup?.mockInput.pressEnter());

    expect(ref.current?.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);
  });

  it("applies programmatic values to the retained Renderable", async () => {
    const events: string[] = [];
    const ref = createRef<InputRenderable>();
    let update: ((value: string) => void) | undefined;
    function App() {
      const [value, setValue] = useState("Before");
      update = setValue;
      return createElement(Input, {
        ref,
        value,
        onInput: (next) => events.push(next),
      });
    }
    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const input = ref.current;

    await act(async () => update?.("After"));
    await setup.waitFor(() => ref.current?.value === "After");

    expect(ref.current).toBe(input);
    expect(events).toEqual(["After"]);
  });
});
