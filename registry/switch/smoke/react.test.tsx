/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { SwitchRootRenderable } from "@tuiparts/core/switch";
import { act, useState } from "react";
import { Switch } from "./components/ui/switch";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

function root(id: string): SwitchRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as SwitchRootRenderable;
}

test("installed React Switch recipe runtime smoke", async () => {
  let disabledChanges = 0;
  function Controlled() {
    const [checked, setChecked] = useState(false);
    return (
      <Switch
        id="controlled"
        label="Controlled"
        checked={checked}
        onCheckedChange={setChecked}
      />
    );
  }

  setup = await testRender(
    <box flexDirection="column">
      <Switch id="uncontrolled" label="Uncontrolled" />
      <Controlled />
      <Switch
        id="disabled"
        label="Disabled"
        disabled
        onCheckedChange={() => disabledChanges++}
      />
      <Switch
        id="custom"
        label="Custom"
        defaultChecked
        density="comfortable"
        symbols="ascii"
      />
    </box>,
    { width: 40, height: 8 },
  );

  const uncontrolled = root("uncontrolled");
  await act(async () => uncontrolled.press());
  await setup.waitFor(() => uncontrolled.checked);
  expect(uncontrolled.checked).toBe(true);

  const controlled = root("controlled");
  await act(async () => controlled.press());
  await setup.waitFor(() => controlled.checked);
  expect(root("controlled")).toBe(controlled);

  const disabled = root("disabled");
  disabled.focus();
  disabled.press();
  expect(disabled.focused).toBe(false);
  expect(disabled.checked).toBe(false);
  expect(disabledChanges).toBe(0);

  expect(root("custom").checked).toBe(true);
});
