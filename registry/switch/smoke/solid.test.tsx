/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { SwitchRootRenderable } from "@opentui-ui/core/switch";
import { createSignal } from "solid-js";
import { Switch } from "./components/ui/switch";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function root(id: string): SwitchRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as SwitchRootRenderable;
}

describe("installed Solid Switch recipe", () => {
  it("covers controlled, uncontrolled, disabled, symbols, and density", async () => {
    const disabledChanges: boolean[] = [];
    setup = await testRender(
      () => {
        const [checked, setChecked] = createSignal(false);
        return (
          <box flexDirection="column">
            <Switch id="uncontrolled" label="Uncontrolled" />
            <Switch
              id="controlled"
              label="Controlled"
              checked={checked()}
              onCheckedChange={setChecked}
            />
            <Switch
              id="disabled"
              label="Disabled"
              disabled
              onCheckedChange={(value) => disabledChanges.push(value)}
            />
            <Switch
              id="custom"
              label="Custom"
              defaultChecked
              density="comfortable"
              symbols="ascii"
            />
          </box>
        );
      },
      { width: 40, height: 8 },
    );

    root("uncontrolled").press();
    await setup.waitFor(() => root("uncontrolled").checked);
    expect(root("uncontrolled").checked).toBe(true);

    const controlled = root("controlled");
    controlled.press();
    await setup.waitFor(() => controlled.checked);
    expect(root("controlled")).toBe(controlled);

    const disabled = root("disabled");
    disabled.focus();
    disabled.press();
    expect(disabled.focused).toBe(false);
    expect(disabled.checked).toBe(false);
    expect(disabledChanges).toEqual([]);

    expect(root("custom").checked).toBe(true);
  });
});
