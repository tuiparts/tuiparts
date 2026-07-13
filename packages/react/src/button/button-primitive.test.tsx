import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  ButtonPressDetails,
  ButtonRootRenderable,
  ButtonState,
} from "@opentui-ui/core/button";
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
  it("composes arbitrary content and exposes readonly state through the real Root ref", async () => {
    let rootRef: ButtonRootRenderable | null = null;
    setup = await testRender(
      createElement(
        Button.Root,
        {
          id: "root",
          ref: (value) => {
            rootRef = value;
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
    ) as ButtonRootRenderable;

    expect(rootRef as unknown).toBe(root);
    expect(textContent("content")).toBe("Ready");
    await act(async () => root.focus());
    await setup.waitFor(() => textContent("content") === "Focused");
    expect(textContent("content")).toBe("Focused");
    expect(Object.isFrozen(root.getState())).toBe(true);
  });

  it("forwards source-specific press details", async () => {
    const presses: ButtonPressDetails[] = [];
    setup = await testRender(
      createElement(Button.Root, {
        id: "press-root",
        onPress: (details) => presses.push(details),
      }),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "press-root",
    ) as ButtonRootRenderable;

    await act(async () => root.press());
    expect(presses).toEqual([{ source: "imperative" }]);
  });

  it("retains Root identity across disabled removal and callback replacement", async () => {
    const presses: string[] = [];
    let setDisabled: (disabled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    let rootRef: ButtonRootRenderable | null = null;

    function App() {
      const [disabled, updateDisabled] = useState(false);
      const [version, updateVersion] = useState(1);
      setDisabled = updateDisabled;
      setVersion = updateVersion;
      return createElement(Button.Root, {
        disabled: disabled || undefined,
        id: "reactive-root",
        onPress: (details) => presses.push(`${version}:${details.source}`),
        ref: (value) => {
          rootRef = value;
        },
      });
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as ButtonRootRenderable;
    expect(rootRef as unknown).toBe(root);

    await act(async () => root.press());
    expect(presses).toEqual(["1:imperative"]);

    await act(async () => {
      root.focus();
      setDisabled(true);
      setVersion(2);
    });
    expect(root.disabled).toBe(true);
    expect(root.focused).toBe(false);
    await act(async () => root.press());
    expect(presses).toHaveLength(1);

    await act(async () => {
      setDisabled(false);
      setVersion(3);
    });
    await act(async () => root.press());
    expect(presses).toEqual(["1:imperative", "3:imperative"]);
    expect(rootRef as unknown).toBe(root);
  });
});
