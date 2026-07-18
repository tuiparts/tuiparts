import { afterEach, describe, expect, it } from "bun:test";
import { TestRecorder, type TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  CheckboxIndicatorRenderable,
  type CheckboxRootRenderable,
  type CheckboxState,
} from "@tuiparts/core/checkbox";
import { act, createElement, Fragment, type ReactNode, useState } from "react";
import * as Checkbox from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Checkbox", () => {
  it("never renders a controlled frame where Root content and Indicator disagree", async () => {
    let setChecked: (checked: boolean) => void = () => {};
    let initialRoot: CheckboxRootRenderable | null = null;

    function App() {
      const [checked, updateChecked] = useState(false);
      setChecked = updateChecked;
      return createElement(
        Checkbox.Root,
        {
          checked,
          flexDirection: "row",
          id: "frame-root",
          ref: (root) => {
            initialRoot ??= root;
          },
        },
        ((state: CheckboxState) =>
          createElement(
            Fragment,
            null,
            createElement("text", { content: state.checked ? "1" : "0" }),
            createElement(
              Checkbox.Indicator,
              null,
              createElement("text", { content: "x" }),
            ),
          )) as unknown as ReactNode,
      );
    }

    setup = await testRender(createElement(App), { width: 4, height: 1 });
    await setup.renderOnce();
    const recorder = new TestRecorder(setup.renderer);
    const visibleState = (frame: string) => frame.split("\n")[0]?.slice(0, 2);
    expect(visibleState(setup.captureCharFrame())).toBe("0 ");

    recorder.rec();
    await act(async () => setChecked(true));
    await setup.waitForFrame((frame) => visibleState(frame) === "1x");
    recorder.stop();

    expect(recorder.recordedFrames.length).toBeGreaterThan(0);
    expect(
      recorder.recordedFrames.map(({ frame }) => visibleState(frame)),
    ).toEqual(recorder.recordedFrames.map(() => "1x"));
    expect(setup.renderer.root.findDescendantById("frame-root")).toBe(
      initialRoot ?? undefined,
    );
  });

  it("composes public parts and arbitrary content around shared state", async () => {
    const changes: boolean[] = [];
    setup = await testRender(
      createElement(
        Checkbox.Root,
        {
          id: "root",
          defaultChecked: true,
          onCheckedChange: (checked) => changes.push(checked),
        },
        createElement(
          Checkbox.Indicator,
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
    expect(root.getState()).toBe(root.store.state);
    expect(indicator.constructor).toBe(CheckboxIndicatorRenderable);
    expect(indicator.store).toBe(root.store);
    expect(indicator.getState()).toBe(root.store.state);
    expect(indicator.visible).toBe(true);

    await act(async () => {
      root.press();
      await setup?.waitFor(() => !root.checked && !indicator.visible);
    });

    expect(root.checked).toBe(false);
    expect(indicator.visible).toBe(false);
    expect(indicator.getState()).toBe(root.store.state);
    expect(changes).toEqual([false]);
  });

  it("retains its Root ref across prop removal and callback replacement", async () => {
    const changes: string[] = [];
    let setControlled: (controlled: boolean) => void = () => {};
    let setVersion: (version: number) => void = () => {};
    const rootRef: { current: CheckboxRootRenderable | null } = {
      current: null,
    };

    function App() {
      const [controlled, updateControlled] = useState(true);
      const [version, updateVersion] = useState(1);
      setControlled = updateControlled;
      setVersion = updateVersion;
      return createElement(Checkbox.Root, {
        id: "reactive-root",
        checked: controlled ? false : undefined,
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

    await act(async () => {
      setControlled(false);
      setVersion(2);
    });
    await act(async () => root.press());
    expect(root.checked).toBe(true);
    expect(changes).toEqual(["2:true"]);
    expect(rootRef.current).toBe(root);
  });
});
