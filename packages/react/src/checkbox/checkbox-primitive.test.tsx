import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  CheckboxIndicatorRenderable,
  CheckboxPrimitiveState,
  CheckboxRootRenderable,
} from "@opentui-ui/core/checkbox";
import { act, createElement, type ReactNode, useState } from "react";
import { CheckboxPrimitive } from "./primitive";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React CheckboxPrimitive", () => {
  it("composes public parts and arbitrary content around shared state", async () => {
    setup = await testRender(
      createElement(
        CheckboxPrimitive.Root,
        { id: "root", defaultChecked: false },
        createElement(
          CheckboxPrimitive.Indicator,
          { id: "indicator" },
          createElement("text", { content: "x" }),
        ),
        createElement("text", { id: "label", content: "Editable recipe" }),
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as CheckboxRootRenderable;
    expect(root.getChildren().map((child) => child.id)).toEqual(["label"]);
    expect(setup.renderer.root.findDescendantById("indicator")).toBeUndefined();

    await act(async () => {
      root.press();
      await setup?.waitFor(
        () =>
          root.checked &&
          setup?.renderer.root.findDescendantById("indicator") !== undefined,
      );
    });

    const indicator = setup.renderer.root.findDescendantById(
      "indicator",
    ) as CheckboxIndicatorRenderable;
    expect(root.checked).toBe(true);
    expect(indicator.visible).toBe(true);
  });

  it("exposes primitive state to consumer-owned rendering", async () => {
    const renderState = (state: CheckboxPrimitiveState) =>
      createElement("text", {
        id: "state-label",
        content: state.checked ? "on" : "off",
      });
    setup = await testRender(
      createElement(
        CheckboxPrimitive.Root,
        { id: "state-root" },
        renderState as unknown as ReactNode,
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "state-root",
    ) as CheckboxRootRenderable;

    expect(textContent("state-label")).toBe("off");

    await act(async () => {
      root.press();
      await setup?.waitFor(() => textContent("state-label") === "on");
    });

    expect(textContent("state-label")).toBe("on");
  });

  it("accepts controlled updates without replacing the Root", async () => {
    function App() {
      const [checked, setChecked] = useState(false);
      return createElement(CheckboxPrimitive.Root, {
        id: "controlled-root",
        checked,
        onCheckedChange: setChecked,
      });
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "controlled-root",
    ) as CheckboxRootRenderable;

    await act(async () => root.press());
    await setup.waitFor(() => root.checked);

    expect(root.checked).toBe(true);
    expect(setup.renderer.root.findDescendantById("controlled-root")).toBe(
      root,
    );
  });

  it("keeps an unchecked Indicator mounted only when requested", async () => {
    setup = await testRender(
      createElement(
        CheckboxPrimitive.Root,
        { id: "mounted-root" },
        createElement(CheckboxPrimitive.Indicator, {
          id: "mounted-indicator",
          keepMounted: true,
        }),
      ),
      { width: 30, height: 5 },
    );

    const indicator = setup.renderer.root.findDescendantById(
      "mounted-indicator",
    ) as CheckboxIndicatorRenderable;
    expect(indicator).toBeDefined();
    expect(indicator.visible).toBe(false);
  });
});
