/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { Checkbox } from "./components/ui/checkbox";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

function text(node: BaseRenderable): string[] {
  if (!node.visible) return [];
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Checkbox recipe", () => {
  it("updates uncontrolled state", async () => {
    setup = await testRender(
      () => <Checkbox id="uncontrolled" label="Uncontrolled" />,
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "uncontrolled",
    ) as CheckboxRootRenderable;

    root.press();
    await setup.waitFor(() => root.checked);

    expect(root.checked).toBe(true);
  });

  it("renders a consumer-owned mark", async () => {
    setup = await testRender(
      () => (
        <Checkbox
          id="custom-mark"
          label="Custom mark"
          defaultChecked
          mark="x"
        />
      ),
      { width: 30, height: 5 },
    );

    const root = setup.renderer.root.findDescendantById(
      "custom-mark",
    ) as CheckboxRootRenderable;
    expect(text(root)).toEqual(["x", "Custom mark"]);
  });

  it("restyles rendered checkboxes on theme switch", async () => {
    theme.register("smoke", {
      tokens: { colors: { primary: "#123456" }, glyphs: { check: "x" } },
    });
    setup = await testRender(
      () => <Checkbox id="themed" label="Theme" defaultChecked />,
      { width: 30, height: 3 },
    );
    const root = setup.renderer.root.findDescendantById(
      "themed",
    ) as CheckboxRootRenderable;
    expect(text(root)).toEqual(["✓", "Theme"]);

    theme.setActive("smoke");
    await setup.waitFor(() => text(root).join(" ") === "x Theme");

    expect(setup.renderer.root.findDescendantById("themed")).toBe(root);
    theme.setActive("terminal");
  });
});
