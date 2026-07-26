import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { CheckboxRootRenderable } from "@tuiparts/core/checkbox";
import {
  CheckboxGroupRenderable,
  CheckboxGroupStore,
} from "@tuiparts/core/checkbox-group";
import { act, createElement, StrictMode, useState } from "react";
import { Checkbox } from "../checkbox";
import { CheckboxGroup } from "./index";

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

describe("React CheckboxGroup", () => {
  it("provides authoritative grouped state during the first render", async () => {
    setup = await testRender(
      createElement(
        CheckboxGroup,
        { defaultValue: ["left"], id: "group" },
        createElement(Checkbox.Root, {
          // biome-ignore lint/correctness/noChildrenProp: ReactNode excludes render-function children.
          children: (state) =>
            createElement("text", {
              content: state.checked ? "checked" : "idle",
              id: "left-state",
            }),
          id: "left",
          value: "left",
        }),
        createElement(Checkbox.Root, { id: "right", value: "right" }),
      ),
      { width: 30, height: 4 },
    );
    const group = setup.renderer.root.findDescendantById("group");
    const left = setup.renderer.root.findDescendantById("left");
    const right = setup.renderer.root.findDescendantById("right");
    if (!(group instanceof CheckboxGroupRenderable))
      throw new Error("Expected CheckboxGroupRenderable group");
    if (!(left instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable left");
    if (!(right instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable right");

    expect(textContent("left-state")).toBe("checked");
    expect(left.group).toBe(group.store);
    await act(async () =>
      setup?.waitFor(() => {
        const key = right.groupKey;
        return key ? group.store.getItemState(key)?.available === true : false;
      }),
    );

    await act(async () => right.press());
    await setup.waitFor(() => group.value.includes("right"));
    expect(group.value).toEqual(["left", "right"]);
  });

  it("updates controlled group props without replacing Renderables", async () => {
    const groupRefs: CheckboxGroupRenderable[] = [];
    const itemRefs: CheckboxRootRenderable[] = [];
    function App() {
      const [value, setValue] = useState<readonly string[]>(["alpha"]);
      return createElement(
        CheckboxGroup,
        {
          id: "controlled-group",
          onValueChange: setValue,
          ref: (next) => {
            if (next) groupRefs.push(next);
          },
          value,
        },
        createElement(Checkbox.Root, {
          id: "alpha",
          ref: (next) => {
            if (next) itemRefs.push(next);
          },
          value: "alpha",
        }),
        createElement(Checkbox.Root, { id: "beta", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = setup.renderer.root.findDescendantById("controlled-group");
    const alpha = setup.renderer.root.findDescendantById("alpha");
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(group instanceof CheckboxGroupRenderable))
      throw new Error("Expected CheckboxGroupRenderable controlled-group");
    if (!(alpha instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable alpha");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable beta");
    await act(async () =>
      setup?.waitFor(() => {
        const key = beta.groupKey;
        return key ? group.store.getItemState(key)?.available === true : false;
      }),
    );
    await act(async () => beta.press());
    await setup.waitFor(() => group.value.includes("beta"));
    expect(group.value).toEqual(["alpha", "beta"]);
    expect(groupRefs.at(-1)).toBe(group);
    expect(itemRefs.at(-1)).toBe(alpha);
  });

  it("releases controlled ownership when the value prop is removed", async () => {
    const requests: Array<readonly string[]> = [];
    let setValue: (value: readonly string[] | undefined) => void = () => {};
    function App() {
      const [value, updateValue] = useState<readonly string[] | undefined>([
        "alpha",
      ]);
      setValue = updateValue;
      return createElement(
        CheckboxGroup,
        {
          id: "ownership-group",
          onValueChange: (nextValue) => requests.push(nextValue),
          value,
        },
        createElement(Checkbox.Root, { id: "ownership-alpha", value: "alpha" }),
        createElement(Checkbox.Root, { id: "ownership-beta", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = setup.renderer.root.findDescendantById("ownership-group");
    const beta = setup.renderer.root.findDescendantById("ownership-beta");
    if (!(group instanceof CheckboxGroupRenderable))
      throw new Error("Expected CheckboxGroupRenderable ownership-group");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable ownership-beta");

    expect(group.value).toEqual(["alpha"]);

    await act(async () => setValue(undefined));
    await act(async () => beta.press());
    await setup.waitFor(() => group.value.includes("beta"));
    expect(group.value).toEqual(["alpha", "beta"]);
    expect(requests).toEqual([["alpha", "beta"]]);
  });

  it("replaces the group callback without replacing its Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    const groupRefs: CheckboxGroupRenderable[] = [];
    function App() {
      const [replacement, setReplacement] = useState(false);
      replaceCallback = () => setReplacement(true);
      return createElement(
        CheckboxGroup,
        {
          defaultValue: ["alpha"],
          onValueChange: () => calls.push(replacement ? "new" : "old"),
          ref: (value) => {
            if (value) groupRefs.push(value);
          },
        },
        createElement(Checkbox.Root, { id: "alpha-callback", value: "alpha" }),
        createElement(Checkbox.Root, { id: "beta-callback", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = groupRefs.at(-1);
    const alpha = setup.renderer.root.findDescendantById("alpha-callback");
    const beta = setup.renderer.root.findDescendantById("beta-callback");
    if (!group)
      throw new Error("Expected CheckboxGroupRenderable callback target");
    if (!(alpha instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable alpha-callback");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable beta-callback");

    await act(async () => replaceCallback());
    await act(async () => alpha.press());

    expect(calls).toEqual(["new"]);
    expect(groupRefs.at(-1)).toBe(group);
  });

  it("releases subscriptions under StrictMode teardown", async () => {
    const originalSubscribe = CheckboxGroupStore.prototype.subscribe;
    let activeSubscriptions = 0;
    CheckboxGroupStore.prototype.subscribe = function subscribe(listener) {
      activeSubscriptions += 1;
      const unsubscribe = originalSubscribe.call(this, listener);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        activeSubscriptions -= 1;
        unsubscribe();
      };
    };
    try {
      setup = await testRender(
        createElement(
          StrictMode,
          undefined,
          createElement(
            CheckboxGroup,
            undefined,
            createElement(
              Checkbox.Root,
              { value: "alpha" },
              createElement(Checkbox.Indicator),
            ),
          ),
        ),
        { width: 20, height: 3 },
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      await act(async () => setup?.renderer.destroy());
      setup = undefined;
      expect(activeSubscriptions).toBe(0);
    } finally {
      CheckboxGroupStore.prototype.subscribe = originalSubscribe;
    }
  });

  it("unregisters conditional Checkboxes before remounting the same value", async () => {
    let setVisible: (visible: boolean) => void = () => {};
    const itemRefs: CheckboxRootRenderable[] = [];
    function App() {
      const [visible, updateVisible] = useState(true);
      setVisible = updateVisible;
      return createElement(
        CheckboxGroup,
        { id: "lifecycle-group" },
        visible
          ? createElement(Checkbox.Root, {
              id: "lifecycle-item",
              ref: (value) => {
                if (value) itemRefs.push(value);
              },
              value: "alpha",
            })
          : undefined,
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const first = itemRefs.at(-1);
    if (!first) throw new Error("Expected initial lifecycle Checkbox");

    await act(async () => setVisible(false));
    await act(async () => setVisible(true));

    const replacement = itemRefs.at(-1);
    if (!replacement)
      throw new Error("Expected replacement lifecycle Checkbox");
    expect(replacement).not.toBe(first);
    await act(async () => replacement.press());
    const group = setup.renderer.root.findDescendantById("lifecycle-group");
    if (!(group instanceof CheckboxGroupRenderable))
      throw new Error("Expected CheckboxGroupRenderable lifecycle-group");
    expect(group.value).toEqual(["alpha"]);
  });
});
