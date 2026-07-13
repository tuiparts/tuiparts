import { afterEach, describe, expect, it } from "bun:test";
import type { BaseRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { createElement, testRender } from "@opentui/solid";
import { Button } from "@opentui-ui/solid";
import { Input } from "./input/primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid adapter", () => {
  it("registers the remaining packaged components and preserves children", async () => {
    setup = await testRender(
      () => {
        const root = createElement("box") as BaseRenderable;
        root.add(Button({ id: "button" }));
        root.add(Input({ id: "input", value: "Input" }));
        return root;
      },
      { width: 40, height: 12 },
    );

    const ids = ["button", "input"];
    expect(
      ids.filter((id) => !setup?.renderer.root.findDescendantById(id)),
    ).toEqual([]);
  });
});
