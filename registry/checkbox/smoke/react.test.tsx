/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { CheckboxRootRenderable } from "@opentui-ui/core/checkbox";
import { act, useState } from "react";
import { Checkbox } from "./components/ui/checkbox";

let setup: TestRendererSetup | undefined;

function root(id: string): CheckboxRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as CheckboxRootRenderable;
}

function text(node: BaseRenderable): string[] {
  if (!node.visible) return [];
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Checkbox recipe runtime smoke", async () => {
  let disabledChanges = 0;

  function Controlled() {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        id="controlled"
        label="Controlled"
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  }

  setup = await testRender(
    <box flexDirection="column">
      <Checkbox id="uncontrolled" label="Uncontrolled" />
      <Controlled />
      <Checkbox
        id="disabled"
        label="Disabled"
        disabled
        onCheckedChange={() => disabledChanges++}
      />
      <Checkbox id="custom-mark" label="Custom mark" defaultChecked mark="x" />
    </box>,
    { width: 40, height: 8 },
  );

  const uncontrolled = root("uncontrolled");
  expect(uncontrolled.checked).toBe(false);
  expect(text(uncontrolled)).toEqual(["Uncontrolled"]);
  await act(async () => uncontrolled.press());
  await setup.waitFor(() => uncontrolled.checked);
  expect(text(uncontrolled)).toEqual(["✓", "Uncontrolled"]);

  const controlled = root("controlled");
  await act(async () => controlled.press());
  await setup.waitFor(() => controlled.checked);
  expect(root("controlled")).toBe(controlled);

  const disabled = root("disabled");
  disabled.focus();
  disabled.press();
  expect(disabled.checked).toBe(false);
  expect(disabled.focused).toBe(false);
  expect(disabledChanges).toBe(0);

  expect(text(root("custom-mark"))).toEqual(["x", "Custom mark"]);
});
