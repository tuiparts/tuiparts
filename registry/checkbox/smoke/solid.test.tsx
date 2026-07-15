/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import { createSignal } from "solid-js";
import { Checkbox } from "./components/ui/checkbox";

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

  it("applies controlled owner updates", async () => {
    setup = await testRender(
      () => {
        const [checked, setChecked] = createSignal(false);
        return (
          <Checkbox
            id="controlled"
            label="Controlled"
            checked={checked()}
            onCheckedChange={setChecked}
          />
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "controlled",
    ) as CheckboxRootRenderable;

    root.press();
    await setup.waitFor(() => root.checked);

    expect(root.checked).toBe(true);
  });

  it("suppresses disabled interaction", async () => {
    const changes: boolean[] = [];
    setup = await testRender(
      () => (
        <Checkbox
          id="disabled"
          label="Disabled"
          disabled
          onCheckedChange={(checked) => changes.push(checked)}
        />
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "disabled",
    ) as CheckboxRootRenderable;

    root.focus();
    root.press();

    expect(root.focused).toBe(false);
    expect(root.checked).toBe(false);
    expect(changes).toEqual([]);
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
});
