import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { ButtonRenderable, ButtonState } from "@tuiparts/core/button";
import { act, createElement, type ReactNode, useState } from "react";
import { Button } from "./button";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Button", () => {
  it("composes arbitrary content and exposes readonly state through the real Button ref", async () => {
    let buttonRef: ButtonRenderable | null = null;
    setup = await testRender(
      createElement(
        Button,
        {
          id: "root",
          ref: (value) => {
            buttonRef = value;
          },
        },
        ((state: ButtonState) =>
          createElement("text", {
            content: state.focused ? "Focused" : "Ready",
            id: "content",
          })) as unknown as ReactNode,
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as ButtonRenderable;

    expect(buttonRef as unknown).toBe(root);
    expect(root.getState()).toBe(root.store.state);
    expect(textContent("content")).toBe("Ready");
    await act(async () => root.focus());
    await setup.waitFor(() => textContent("content") === "Focused");
    expect(textContent("content")).toBe("Focused");
    expect(Object.isFrozen(root.getState())).toBe(true);
  });

  it("retains Button identity across callback replacement", async () => {
    const presses: string[] = [];
    let setVersion: (version: number) => void = () => {};
    let buttonRef: ButtonRenderable | null = null;

    function App() {
      const [version, updateVersion] = useState(1);
      setVersion = updateVersion;
      return createElement(Button, {
        id: "reactive-root",
        onPress: (details) => presses.push(`${version}:${details.source}`),
        ref: (value) => {
          buttonRef = value;
        },
      });
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as ButtonRenderable;
    expect(buttonRef as unknown).toBe(root);

    await act(async () => setVersion(2));
    await act(async () => root.press());
    expect(presses).toEqual(["2:imperative"]);
    expect(buttonRef as unknown).toBe(root);
  });
});
