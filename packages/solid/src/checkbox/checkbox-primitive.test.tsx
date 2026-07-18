/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
} from "@tuiparts/core/checkbox";
import { createSignal } from "solid-js";
import * as Checkbox from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Checkbox", () => {
  it("composes public parts and arbitrary content around shared state", async () => {
    setup = await testRender(
      () => (
        <Checkbox.Root id="root">
          <Checkbox.Indicator id="indicator">
            <text content="x" />
          </Checkbox.Indicator>
          <text id="label" content="Editable recipe" />
        </Checkbox.Root>
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as CheckboxRootRenderable;
    expect(root.getChildren().map((child) => child.id)).toEqual([
      "indicator",
      "label",
    ]);
    const indicator = setup.renderer.root.findDescendantById(
      "indicator",
    ) as CheckboxIndicatorRenderable;
    expect(indicator.visible).toBe(false);

    root.press();
    await setup.waitFor(() => root.checked && indicator.visible);

    expect(root.checked).toBe(true);
    expect(indicator.visible).toBe(true);
  });

  it("retains its Root ref across prop removal and callback replacement", async () => {
    const changes: string[] = [];
    let setControlled: (controlled: boolean) => void = () => {};
    let setDisabled: (disabled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    let rootRef: CheckboxRootRenderable | undefined;

    setup = await testRender(
      () => {
        const [controlled, updateControlled] = createSignal(true);
        const [disabled, updateDisabled] = createSignal(false);
        const [version, updateVersion] = createSignal(1);
        setControlled = updateControlled;
        setDisabled = updateDisabled;
        setVersion = updateVersion;
        return (
          <Checkbox.Root
            id="reactive-root"
            checked={controlled() ? false : undefined}
            disabled={disabled() || undefined}
            onCheckedChange={(checked) =>
              changes.push(`${version()}:${String(checked)}`)
            }
            ref={(value) => {
              rootRef = value;
            }}
          />
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as CheckboxRootRenderable;
    expect(rootRef).toBe(root);
    expect(root.checked).toBe(false);

    // Prop removal: clearing the controlled `checked` prop releases the Root,
    // and the replaced callback fires through the new version.
    setControlled(false);
    setVersion(2);
    root.press();
    await setup.waitFor(() => root.checked);
    expect(changes).toEqual(["2:true"]);
    expect(rootRef).toBe(root);

    // Reactive disabled prop propagation and removal on the retained Root.
    setDisabled(true);
    await setup.waitFor(() => root.disabled);
    setDisabled(false);
    await setup.waitFor(() => !root.disabled);
    expect(rootRef).toBe(root);
  });

  it("retains Indicator identity across a state update", async () => {
    let rootRef: CheckboxRootRenderable | undefined;
    let indicatorRef: CheckboxIndicatorRenderable | undefined;
    setup = await testRender(
      () => (
        <Checkbox.Root
          id="lifecycle-root"
          ref={(value) => {
            rootRef = value;
          }}
        >
          <Checkbox.Indicator
            id="lifecycle-indicator"
            ref={(value) => {
              indicatorRef = value;
            }}
          />
        </Checkbox.Root>
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "lifecycle-root",
    ) as CheckboxRootRenderable;
    expect(rootRef).toBe(root);
    const indicator = setup.renderer.root.findDescendantById(
      "lifecycle-indicator",
    ) as CheckboxIndicatorRenderable;
    expect(indicatorRef).toBe(indicator);
    expect(indicator.visible).toBe(false);

    root.press();
    await setup.waitFor(() => indicator.visible);
    expect(setup.renderer.root.findDescendantById("lifecycle-indicator")).toBe(
      indicator,
    );
    expect(indicatorRef).toBe(indicator);
  });
});
