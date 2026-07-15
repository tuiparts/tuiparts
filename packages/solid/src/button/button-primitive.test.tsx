/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  ButtonPressDetails,
  ButtonRenderable,
  ButtonState,
} from "@tuiparts/core/button";
import { createSignal } from "solid-js";
import { Button } from "./button";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Button", () => {
  it("composes arbitrary content and exposes readonly state through the real Button ref", async () => {
    let buttonRef: ButtonRenderable | undefined;
    setup = await testRender(
      () => (
        <Button
          id="root"
          ref={(value) => {
            buttonRef = value;
          }}
        >
          {(state: ButtonState) => (
            <text content={state.focused ? "Focused" : "Ready"} id="content" />
          )}
        </Button>
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as ButtonRenderable;

    expect(buttonRef).toBe(root);
    expect(textContent("content")).toBe("Ready");
    root.focus();
    await setup.waitFor(() => textContent("content") === "Focused");
    expect(textContent("content")).toBe("Focused");
    expect(Object.isFrozen(root.getState())).toBe(true);
  });

  it("retains Button identity across disabled removal and callback replacement", async () => {
    const presses: string[] = [];
    let setDisabled: (disabled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    let buttonRef: ButtonRenderable | undefined;

    setup = await testRender(
      () => {
        const [disabled, updateDisabled] = createSignal(false);
        const [version, updateVersion] = createSignal(1);
        setDisabled = updateDisabled;
        setVersion = updateVersion;
        return (
          <Button
            disabled={disabled() || undefined}
            id="reactive-root"
            onPress={(details: ButtonPressDetails) =>
              presses.push(`${version()}:${details.source}`)
            }
            ref={(value) => {
              buttonRef = value;
            }}
          />
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as ButtonRenderable;
    expect(buttonRef).toBe(root);

    root.press();
    expect(presses).toEqual(["1:imperative"]);

    root.focus();
    setDisabled(true);
    setVersion(2);
    await setup.waitFor(() => root.disabled && !root.focused);
    root.press();
    expect(presses).toHaveLength(1);

    setDisabled(false);
    setVersion(3);
    await setup.waitFor(() => !root.disabled);
    root.press();
    expect(presses).toEqual(["1:imperative", "3:imperative"]);
    expect(buttonRef).toBe(root);
  });
});
