import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { Button } from "@opentui-ui/react";
import { act, createElement, Fragment } from "react";
import { Input } from "./input/primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  if (setup) await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React adapter", () => {
  it("registers the remaining packaged components and routes children", async () => {
    function App() {
      return createElement(
        Fragment,
        null,
        createElement(
          Button,
          { id: "button" },
          createElement("text", { content: "Button" }),
        ),
        createElement(Input, { id: "input", value: "Input" }),
      );
    }

    setup = await testRender(createElement(App), { width: 40, height: 12 });
    const ids = ["button", "input"];
    expect(
      ids.filter((id) => !setup?.renderer.root.findDescendantById(id)),
    ).toEqual([]);
  });
});
