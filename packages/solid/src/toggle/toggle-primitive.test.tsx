/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ToggleRenderable, type ToggleState } from "@tuiparts/core/toggle";
import { createSignal } from "solid-js";
import { Toggle } from "./index";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id);
  if (!(text instanceof TextRenderable))
    throw new Error(`Expected TextRenderable ${id}`);
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Toggle", () => {
  it("renders state and exposes the actual Core Renderable", async () => {
    let toggleRef: ToggleRenderable | undefined;
    setup = await testRender(
      () => (
        <Toggle
          defaultPressed
          id="toggle"
          ref={(value) => {
            toggleRef = value;
          }}
        >
          {(state: ToggleState) => (
            <text content={state.pressed ? "on" : "off"} id="state" />
          )}
        </Toggle>
      ),
      { width: 20, height: 4 },
    );
    const toggle = setup.renderer.root.findDescendantById("toggle");
    if (!(toggle instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable toggle");

    expect(toggleRef).toBe(toggle);
    expect(textContent("state")).toBe("on");
    toggle.press();
    await setup.waitFor(() => textContent("state") === "off");
  });

  it("reactively clears controlled and disabled props on a retained Toggle", async () => {
    let release: () => void = () => {};
    let toggleRef: ToggleRenderable | undefined;
    setup = await testRender(
      () => {
        const [controlled, setControlled] = createSignal(true);
        const [pressed, setPressed] = createSignal(true);
        release = () => setControlled(false);
        return (
          <Toggle
            disabled={controlled() || undefined}
            id="retained"
            onPressedChange={setPressed}
            pressed={controlled() ? pressed() : undefined}
            ref={(value) => {
              toggleRef = value;
            }}
          />
        );
      },
      { width: 20, height: 4 },
    );
    const toggle = toggleRef;
    expect(toggle).toBeDefined();
    release();
    await setup.waitFor(() => toggle?.disabled === false);
    toggle?.press();
    expect(toggle?.pressed).toBe(false);
    expect(toggleRef).toBe(toggle);
  });

  it("replaces callbacks without replacing the Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    let toggleRef: ToggleRenderable | undefined;
    setup = await testRender(
      () => {
        const [replacement, setReplacement] = createSignal(false);
        replaceCallback = () => setReplacement(true);
        return (
          <Toggle
            onPressedChange={
              replacement() ? () => calls.push("new") : () => calls.push("old")
            }
            ref={(value) => {
              toggleRef = value;
            }}
          />
        );
      },
      { width: 20, height: 4 },
    );
    const toggle = toggleRef;
    if (!toggle) throw new Error("Expected ToggleRenderable callback target");

    toggle.press();
    replaceCallback();
    await Promise.resolve();
    toggle.press();

    expect(calls).toEqual(["old", "new"]);
    expect(toggleRef).toBe(toggle);
  });
});
