import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  CheckboxIndicatorRenderable,
  CheckboxPrimitiveState,
  CheckboxRootRenderable,
} from "@opentui-ui/core/checkbox";
import { act, createElement, type ReactNode, useState } from "react";
import { CheckboxPrimitive } from "./primitive";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React CheckboxPrimitive", () => {
  it("composes public parts and arbitrary content around shared state", async () => {
    setup = await testRender(
      createElement(
        CheckboxPrimitive.Root,
        { id: "root", defaultChecked: false },
        createElement(
          CheckboxPrimitive.Indicator,
          { id: "indicator" },
          createElement("text", { content: "x" }),
        ),
        createElement("text", { id: "label", content: "Editable recipe" }),
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

    await act(async () => {
      root.press();
      await setup?.waitFor(() => root.checked && indicator.visible);
    });

    expect(root.checked).toBe(true);
    expect(indicator.visible).toBe(true);
  });

  it("exposes primitive state to consumer-owned rendering", async () => {
    const renderState = (state: CheckboxPrimitiveState) =>
      createElement("text", {
        id: "state-label",
        content: state.checked ? "on" : "off",
      });
    setup = await testRender(
      createElement(
        CheckboxPrimitive.Root,
        { id: "state-root" },
        renderState as unknown as ReactNode,
      ),
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "state-root",
    ) as CheckboxRootRenderable;

    expect(textContent("state-label")).toBe("off");

    await act(async () => {
      root.press();
      await setup?.waitFor(() => textContent("state-label") === "on");
    });

    expect(textContent("state-label")).toBe("on");
  });

  it("accepts controlled updates without replacing the Root", async () => {
    function App() {
      const [checked, setChecked] = useState(false);
      return createElement(CheckboxPrimitive.Root, {
        id: "controlled-root",
        checked,
        onCheckedChange: setChecked,
      });
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "controlled-root",
    ) as CheckboxRootRenderable;

    await act(async () => root.press());
    await setup.waitFor(() => root.checked);

    expect(root.checked).toBe(true);
    expect(setup.renderer.root.findDescendantById("controlled-root")).toBe(
      root,
    );
  });

  it("retains its Root ref across prop removal and callback replacement", async () => {
    const changes: string[] = [];
    let setControlled: (controlled: boolean) => void = () => {};
    let setDisabled: (disabled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    const rootRef: { current: CheckboxRootRenderable | null } = {
      current: null,
    };

    function App() {
      const [controlled, updateControlled] = useState(true);
      const [disabled, updateDisabled] = useState(false);
      const [version, updateVersion] = useState(1);
      setControlled = updateControlled;
      setDisabled = updateDisabled;
      setVersion = updateVersion;
      return createElement(CheckboxPrimitive.Root, {
        id: "reactive-root",
        checked: controlled ? false : undefined,
        disabled: disabled || undefined,
        onCheckedChange: (checked) =>
          changes.push(`${version}:${String(checked)}`),
        ref: (value) => {
          rootRef.current = value;
        },
      });
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "reactive-root",
    ) as CheckboxRootRenderable;
    expect(rootRef.current).toBe(root);

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
    expect(rootRef.current).toBe(root);

    await act(async () => {
      root.focus();
      setDisabled(true);
    });
    expect(root.focused).toBe(false);
    await act(async () => root.press());
    expect(changes).toHaveLength(2);

    await act(async () => setDisabled(false));
    await act(async () => root.press());
    expect(root.checked).toBe(false);
    expect(changes.at(-1)).toBe("2:false");
    expect(rootRef.current).toBe(root);
  });

  it("retains Indicator identity while synchronizing visibility", async () => {
    const refs: CheckboxIndicatorRenderable[] = [];
    const rootRef: { current: CheckboxRootRenderable | null } = {
      current: null,
    };

    function App() {
      return createElement(
        CheckboxPrimitive.Root,
        {
          id: "lifecycle-root",
          ref: (value) => {
            rootRef.current = value;
          },
        },
        createElement(CheckboxPrimitive.Indicator, {
          id: "lifecycle-indicator",
          ref: (value) => {
            if (value) refs.push(value);
          },
        }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 5 });
    const root = setup.renderer.root.findDescendantById(
      "lifecycle-root",
    ) as CheckboxRootRenderable;
    expect(rootRef.current).toBe(root);
    const indicator = setup.renderer.root.findDescendantById(
      "lifecycle-indicator",
    ) as CheckboxIndicatorRenderable;
    expect(refs).toEqual([indicator]);
    expect(indicator.visible).toBe(false);

    await act(async () => root.press());
    expect(indicator.visible).toBe(true);
    await act(async () => root.press());
    expect(indicator.visible).toBe(false);
    expect(refs).toEqual([indicator]);
    expect(setup.renderer.root.findDescendantById("lifecycle-indicator")).toBe(
      indicator,
    );
  });
});
