/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { InputPrimitiveRenderable } from "@opentui-ui/core/input";
import { act, createRef } from "react";
import { Input } from "./components/ui/input";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Input recipe", () => {
  it("routes native events once", async () => {
    const events: string[] = [];
    const ref = createRef<InputPrimitiveRenderable>();
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
});
