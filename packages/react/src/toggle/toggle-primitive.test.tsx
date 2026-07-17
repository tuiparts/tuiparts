import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import { act, createElement, type ReactNode, useState } from "react";
import { Toggle } from "./index";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id);
  if (!(text instanceof TextRenderable))
    throw new Error(`Expected TextRenderable ${id}`);
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Toggle", () => {
  it("renders standalone state and exposes the actual Core Renderable", async () => {
    const refs: ToggleRenderable[] = [];
    setup = await testRender(
      createElement(
        Toggle,
        {
          defaultPressed: true,
          id: "toggle",
          ref: (value) => {
            if (value) refs.push(value);
          },
        },
        ((state: Toggle.State) =>
          createElement("text", {
            content: state.pressed ? "on" : "off",
            id: "state",
          })) as unknown as ReactNode,
      ),
      { width: 20, height: 4 },
    );
    const toggle = setup.renderer.root.findDescendantById("toggle");
    if (!(toggle instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable toggle");

    expect(refs.at(-1)).toBe(toggle);
    expect(textContent("state")).toBe("on");
    await act(async () => toggle.press());
    await setup.waitFor(() => textContent("state") === "off");
    expect(toggle.pressed).toBe(false);
  });

  it("retains identity across controlled updates and prop removal", async () => {
    let setPressed: (pressed: boolean | undefined) => void = () => {};
    const refs: ToggleRenderable[] = [];
    function App() {
      const [pressed, updatePressed] = useState<boolean | undefined>(true);
      setPressed = updatePressed;
      return createElement(Toggle, {
        id: "retained",
        onPressedChange: updatePressed,
        pressed,
        ref: (value) => {
          if (value) refs.push(value);
        },
      });
    }

    setup = await testRender(createElement(App), { width: 20, height: 4 });
    const toggle = setup.renderer.root.findDescendantById("retained");
    if (!(toggle instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable retained");
    await act(async () => toggle.press());
    expect(toggle.pressed).toBe(false);
    await act(async () => setPressed(undefined));
    await act(async () => toggle.press());
    expect(toggle.pressed).toBe(true);
    expect(refs.at(-1)).toBe(toggle);
  });

  it("replaces callbacks without replacing the Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    const refs: ToggleRenderable[] = [];
    function App() {
      const [replacement, setReplacement] = useState(false);
      replaceCallback = () => setReplacement(true);
      return createElement(Toggle, {
        onPressedChange: () => calls.push(replacement ? "new" : "old"),
        ref: (value) => {
          if (value) refs.push(value);
        },
      });
    }

    setup = await testRender(createElement(App), { width: 20, height: 4 });
    const toggle = refs.at(-1);
    if (!toggle) throw new Error("Expected ToggleRenderable callback target");

    await act(async () => toggle.press());
    await act(async () => replaceCallback());
    await act(async () => toggle.press());

    expect(calls).toEqual(["old", "new"]);
    expect(refs.at(-1)).toBe(toggle);
  });
});
