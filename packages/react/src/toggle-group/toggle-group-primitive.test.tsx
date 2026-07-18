import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { ToggleRenderable } from "@tuiparts/core/toggle";
import { ToggleGroupRenderable } from "@tuiparts/core/toggle-group";
import { act, createElement, useState } from "react";
import { Toggle } from "../toggle";
import { ToggleGroup } from "./index";

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

describe("React ToggleGroup", () => {
  it("provides authoritative grouped state during the first render", async () => {
    setup = await testRender(
      createElement(
        ToggleGroup,
        { defaultValue: ["left"], id: "group" },
        createElement(Toggle, {
          // biome-ignore lint/correctness/noChildrenProp: ReactNode excludes render-function children.
          children: (state) =>
            createElement("text", {
              content: state.pressed ? "pressed" : "idle",
              id: "left-state",
            }),
          id: "left",
          value: "left",
        }),
        createElement(Toggle, { id: "right", value: "right" }),
      ),
      { width: 30, height: 4 },
    );
    const group = setup.renderer.root.findDescendantById("group");
    const left = setup.renderer.root.findDescendantById("left");
    const right = setup.renderer.root.findDescendantById("right");
    if (!(group instanceof ToggleGroupRenderable))
      throw new Error("Expected ToggleGroupRenderable group");
    if (!(left instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable left");
    if (!(right instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable right");

    expect(textContent("left-state")).toBe("pressed");
    expect(left.group).toBe(group.store);
    await act(async () =>
      setup?.waitFor(() => {
        const key = right.groupKey;
        return key ? group.store.getItemState(key)?.available === true : false;
      }),
    );

    await act(async () => right.press());
    await setup.waitFor(() => group.value[0] === "right");
    expect(group.value).toEqual(["right"]);
  });

  it("updates controlled group props without replacing Renderables", async () => {
    const groupRefs: ToggleGroupRenderable[] = [];
    const itemRefs: ToggleRenderable[] = [];
    function App() {
      const [value, setValue] = useState<readonly string[]>(["alpha"]);
      return createElement(
        ToggleGroup,
        {
          id: "controlled-group",
          multiple: true,
          onValueChange: setValue,
          ref: (next) => {
            if (next) groupRefs.push(next);
          },
          value,
        },
        createElement(Toggle, {
          id: "alpha",
          ref: (next) => {
            if (next) itemRefs.push(next);
          },
          value: "alpha",
        }),
        createElement(Toggle, { id: "beta", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = setup.renderer.root.findDescendantById("controlled-group");
    const alpha = setup.renderer.root.findDescendantById("alpha");
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(group instanceof ToggleGroupRenderable))
      throw new Error("Expected ToggleGroupRenderable controlled-group");
    if (!(alpha instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable alpha");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable beta");
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
        ToggleGroup,
        {
          id: "ownership-group",
          onValueChange: (nextValue) => requests.push(nextValue),
          value,
        },
        createElement(Toggle, { id: "ownership-alpha", value: "alpha" }),
        createElement(Toggle, { id: "ownership-beta", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = setup.renderer.root.findDescendantById("ownership-group");
    const beta = setup.renderer.root.findDescendantById("ownership-beta");
    if (!(group instanceof ToggleGroupRenderable))
      throw new Error("Expected ToggleGroupRenderable ownership-group");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable ownership-beta");

    expect(group.value).toEqual(["alpha"]);

    await act(async () => setValue(undefined));
    await act(async () => beta.press());
    await setup.waitFor(() => group.value[0] === "beta");
    expect(group.value).toEqual(["beta"]);
    expect(requests).toEqual([["beta"]]);
  });

  it("replaces the group callback without replacing its Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    const groupRefs: ToggleGroupRenderable[] = [];
    function App() {
      const [replacement, setReplacement] = useState(false);
      replaceCallback = () => setReplacement(true);
      return createElement(
        ToggleGroup,
        {
          defaultValue: ["alpha"],
          onValueChange: () => calls.push(replacement ? "new" : "old"),
          ref: (value) => {
            if (value) groupRefs.push(value);
          },
        },
        createElement(Toggle, { id: "alpha-callback", value: "alpha" }),
        createElement(Toggle, { id: "beta-callback", value: "beta" }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 4 });
    const group = groupRefs.at(-1);
    const alpha = setup.renderer.root.findDescendantById("alpha-callback");
    const beta = setup.renderer.root.findDescendantById("beta-callback");
    if (!group)
      throw new Error("Expected ToggleGroupRenderable callback target");
    if (!(alpha instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable alpha-callback");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable beta-callback");

    await act(async () => replaceCallback());
    await act(async () => alpha.press());

    expect(calls).toEqual(["new"]);
    expect(groupRefs.at(-1)).toBe(group);
  });

  it("unregisters conditional Toggles before remounting the same value", async () => {
    let setVisible: (visible: boolean) => void = () => {};
    const itemRefs: ToggleRenderable[] = [];
    function App() {
      const [visible, updateVisible] = useState(true);
      setVisible = updateVisible;
      return createElement(
        ToggleGroup,
        { id: "lifecycle-group" },
        visible
          ? createElement(Toggle, {
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
    if (!first) throw new Error("Expected initial lifecycle Toggle");

    await act(async () => setVisible(false));
    await act(async () => setVisible(true));

    const replacement = itemRefs.at(-1);
    if (!replacement) throw new Error("Expected replacement lifecycle Toggle");
    expect(replacement).not.toBe(first);
    await act(async () => replacement.press());
    const group = setup.renderer.root.findDescendantById("lifecycle-group");
    if (!(group instanceof ToggleGroupRenderable))
      throw new Error("Expected ToggleGroupRenderable lifecycle-group");
    expect(group.value).toEqual(["alpha"]);
  });
});
