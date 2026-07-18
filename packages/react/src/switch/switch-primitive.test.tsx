import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  type SwitchRootRenderable,
  type SwitchState,
  SwitchThumbRenderable,
} from "@tuiparts/core/switch";
import { act, createElement, type ReactNode, useState } from "react";
import * as Switch from "./primitive";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Switch", () => {
  it("composes a retained Thumb around shared state", async () => {
    setup = await testRender(
      createElement(
        Switch.Root,
        { id: "root" },
        createElement(Switch.Thumb, { id: "thumb" }),
        createElement("text", { id: "label", content: "Editable recipe" }),
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as SwitchRootRenderable;
    const thumb = setup.renderer.root.findDescendantById(
      "thumb",
    ) as SwitchThumbRenderable;
    expect(root.getState()).toBe(root.store.state);
    expect(thumb.constructor).toBe(SwitchThumbRenderable);
    expect(thumb.store).toBe(root.store);
    expect(thumb.getState()).toBe(root.store.state);

    expect(root.getChildren().map((child) => child.id)).toEqual([
      "thumb",
      "label",
    ]);
    expect(thumb.getState().checked).toBe(false);

    await act(async () => root.press());
    await setup.waitFor(() => thumb.getState().checked);

    expect(root.checked).toBe(true);
    expect(thumb.getState()).toBe(root.store.state);
    expect(setup.renderer.root.findDescendantById("thumb")).toBe(thumb);
  });

  it("exposes readonly state to consumer-owned rendering", async () => {
    setup = await testRender(
      createElement(Switch.Root, { id: "state-root" }, ((state: SwitchState) =>
        createElement("text", {
          id: "state-label",
          content: state.checked ? "on" : "off",
        })) as unknown as ReactNode),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "state-root",
    ) as SwitchRootRenderable;

    expect(textContent("state-label")).toBe("off");
    await act(async () => root.press());
    await setup.waitFor(() => textContent("state-label") === "on");
    expect(textContent("state-label")).toBe("on");
  });

  it("retains refs across controlled prop removal and callback replacement", async () => {
    const changes: string[] = [];
    let setControlled: (controlled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    let rootRef: SwitchRootRenderable | null = null;
    let thumbRef: SwitchThumbRenderable | null = null;

    function App() {
      const [controlled, updateControlled] = useState(true);
      const [version, updateVersion] = useState(1);
      setControlled = updateControlled;
      setVersion = updateVersion;
      return createElement(
        Switch.Root,
        {
          id: "reactive-root",
          checked: controlled ? false : undefined,
          onCheckedChange: (checked) =>
            changes.push(`${version}:${String(checked)}`),
          ref: (value) => {
            rootRef = value;
          },
        },
        createElement(Switch.Thumb, {
          id: "reactive-thumb",
          ref: (value) => {
            thumbRef = value;
          },
        }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as SwitchRootRenderable;
    const thumb = setup.renderer.root.findDescendantById(
      "reactive-thumb",
    ) as SwitchThumbRenderable;
    expect(rootRef as unknown).toBe(root);
    expect(thumbRef as unknown).toBe(thumb);

    await act(async () => root.press());
    expect(changes).toEqual(["1:true"]);
    expect(root.checked).toBe(false);

    await act(async () => {
      setControlled(false);
      setVersion(2);
    });
    await act(async () => root.press());
    expect(root.checked).toBe(true);
    expect(changes).toEqual(["1:true", "2:true"]);

    expect(rootRef as unknown).toBe(root);
    expect(thumbRef as unknown).toBe(thumb);
    expect(setup.renderer.root.findDescendantById("reactive-thumb")).toBe(
      thumb,
    );
  });
});
