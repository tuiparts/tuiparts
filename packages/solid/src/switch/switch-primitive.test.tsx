/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  SwitchRootRenderable,
  SwitchState,
  SwitchThumbRenderable,
} from "@tuiparts/core/switch";
import { createSignal } from "solid-js";
import * as Switch from "./primitive";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Switch", () => {
  it("fails clearly when Thumb is rendered without Root", async () => {
    await expect(
      testRender(() => <Switch.Thumb />, {
        width: 30,
        height: 5,
      }),
    ).rejects.toThrow("Switch.Thumb must be rendered inside Switch.Root");
  });

  it("composes a retained Thumb around shared state", async () => {
    setup = await testRender(
      () => (
        <Switch.Root id="root">
          <Switch.Thumb id="thumb" />
          <text id="label" content="Editable recipe" />
        </Switch.Root>
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as SwitchRootRenderable;
    const thumb = setup.renderer.root.findDescendantById(
      "thumb",
    ) as SwitchThumbRenderable;

    expect(root.getChildren().map((child) => child.id)).toEqual([
      "thumb",
      "label",
    ]);
    expect(thumb.getState().checked).toBe(false);

    root.press();
    await setup.waitFor(() => thumb.getState().checked);

    expect(root.checked).toBe(true);
    expect(setup.renderer.root.findDescendantById("thumb")).toBe(thumb);
  });

  it("exposes readonly state to consumer-owned rendering", async () => {
    setup = await testRender(
      () => (
        <Switch.Root id="state-root">
          {(state: SwitchState) => (
            <text id="state-label" content={state.checked ? "on" : "off"} />
          )}
        </Switch.Root>
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "state-root",
    ) as SwitchRootRenderable;

    expect(textContent("state-label")).toBe("off");
    root.press();
    await setup.waitFor(() => textContent("state-label") === "on");
    expect(textContent("state-label")).toBe("on");
  });

  it("retains refs across controlled prop removal and callback replacement", async () => {
    const changes: string[] = [];
    let setControlled: (controlled: boolean) => void = () => {};
    let setDisabled: (disabled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    let rootRef: SwitchRootRenderable | undefined;
    let thumbRef: SwitchThumbRenderable | undefined;

    setup = await testRender(
      () => {
        const [controlled, updateControlled] = createSignal(true);
        const [disabled, updateDisabled] = createSignal(false);
        const [version, updateVersion] = createSignal(1);
        setControlled = updateControlled;
        setDisabled = updateDisabled;
        setVersion = updateVersion;
        return (
          <Switch.Root
            id="reactive-root"
            checked={controlled() ? false : undefined}
            disabled={disabled() || undefined}
            onCheckedChange={(checked) =>
              changes.push(`${version()}:${String(checked)}`)
            }
            ref={(value) => {
              rootRef = value;
            }}
          >
            <Switch.Thumb
              id="reactive-thumb"
              ref={(value) => {
                thumbRef = value;
              }}
            />
          </Switch.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as SwitchRootRenderable;
    const thumb = setup.renderer.root.findDescendantById(
      "reactive-thumb",
    ) as SwitchThumbRenderable;
    expect(rootRef).toBe(root);
    expect(thumbRef).toBe(thumb);

    root.press();
    expect(changes).toEqual(["1:true"]);
    expect(root.checked).toBe(false);

    setControlled(false);
    setVersion(2);
    root.press();
    await setup.waitFor(() => root.checked);
    expect(changes).toEqual(["1:true", "2:true"]);

    root.focus();
    setDisabled(true);
    await setup.waitFor(() => root.disabled && !root.focused);
    root.press();
    expect(changes).toHaveLength(2);

    expect(rootRef).toBe(root);
    expect(thumbRef).toBe(thumb);
    expect(setup.renderer.root.findDescendantById("reactive-thumb")).toBe(
      thumb,
    );
  });
});
