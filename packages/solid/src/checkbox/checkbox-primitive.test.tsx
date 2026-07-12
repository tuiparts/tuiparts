import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { createElement, testRender } from "@opentui/solid";
import type {
  CheckboxIndicatorRenderable,
  CheckboxPrimitiveState,
  CheckboxRootRenderable,
} from "@opentui-ui/core/checkbox";
import { createSignal } from "solid-js";
import { CheckboxPrimitive } from "./primitive";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid CheckboxPrimitive", () => {
  it("composes public parts and arbitrary content around shared state", async () => {
    setup = await testRender(
      () =>
        CheckboxPrimitive.Root({
          id: "root",
          defaultChecked: false,
          get children() {
            const indicatorText = createElement("text") as TextRenderable;
            indicatorText.content = "x";
            const label = createElement("text") as TextRenderable;
            label.id = "label";
            label.content = "Editable recipe";
            return [
              CheckboxPrimitive.Indicator({
                id: "indicator",
                get children() {
                  return indicatorText;
                },
              }),
              label,
            ];
          },
        }),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as CheckboxRootRenderable;
    expect(root.getChildren().map((child) => child.id)).toEqual(["label"]);
    expect(setup.renderer.root.findDescendantById("indicator")).toBeUndefined();

    root.press();
    await setup.waitFor(
      () => setup?.renderer.root.findDescendantById("indicator") !== undefined,
    );

    const indicator = setup.renderer.root.findDescendantById(
      "indicator",
    ) as CheckboxIndicatorRenderable;
    expect(root.checked).toBe(true);
    expect(indicator.visible).toBe(true);
  });

  it("exposes primitive state to consumer-owned rendering", async () => {
    setup = await testRender(
      () =>
        CheckboxPrimitive.Root({
          id: "state-root",
          children: (state: CheckboxPrimitiveState) => {
            const label = createElement("text") as TextRenderable;
            label.id = "state-label";
            label.content = state.checked ? "on" : "off";
            return label;
          },
        }),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "state-root",
    ) as CheckboxRootRenderable;

    expect(textContent("state-label")).toBe("off");

    root.press();
    await setup.waitFor(() => textContent("state-label") === "on");

    expect(textContent("state-label")).toBe("on");
  });

  it("accepts controlled updates without replacing the Root", async () => {
    setup = await testRender(
      () => {
        const [checked, setChecked] = createSignal(false);
        return CheckboxPrimitive.Root({
          id: "controlled-root",
          get checked() {
            return checked();
          },
          onCheckedChange: setChecked,
        });
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "controlled-root",
    ) as CheckboxRootRenderable;

    root.press();
    await setup.waitFor(() => root.checked);

    expect(root.checked).toBe(true);
    expect(setup.renderer.root.findDescendantById("controlled-root")).toBe(
      root,
    );
  });

  it("keeps an unchecked Indicator mounted only when requested", async () => {
    setup = await testRender(
      () =>
        CheckboxPrimitive.Root({
          id: "mounted-root",
          get children() {
            return CheckboxPrimitive.Indicator({
              id: "mounted-indicator",
              keepMounted: true,
            });
          },
        }),
      { width: 30, height: 5 },
    );

    const indicator = setup.renderer.root.findDescendantById(
      "mounted-indicator",
    ) as CheckboxIndicatorRenderable;
    expect(indicator).toBeDefined();
    expect(indicator.visible).toBe(false);
  });
});
