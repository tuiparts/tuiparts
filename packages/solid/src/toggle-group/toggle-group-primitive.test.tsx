/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ToggleRenderable, type ToggleState } from "@tuiparts/core/toggle";
import { ToggleGroupRenderable } from "@tuiparts/core/toggle-group";
import { createSignal } from "solid-js";
import { Toggle } from "../toggle";
import { ToggleGroup } from "./index";

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

describe("Solid ToggleGroup", () => {
  it("provides grouped state and keeps selection separate from focus movement", async () => {
    setup = await testRender(
      () => (
        <ToggleGroup defaultValue={["left"]} id="group">
          <Toggle id="left" value="left">
            {(state: ToggleState) => (
              <text
                content={state.pressed ? "pressed" : "idle"}
                id="left-state"
              />
            )}
          </Toggle>
          <Toggle id="right" value="right" />
        </ToggleGroup>
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
    left.focus();
    await setup.mockInput.pressArrow("right");
    expect(right.focused).toBe(true);
    expect(group.value).toEqual(["left"]);
    right.press();
    await setup.waitFor(() => group.value[0] === "right");
  });

  it("reactively updates controlled values without replacing Renderables", async () => {
    let groupRef: ToggleGroupRenderable | undefined;
    let itemRef: ToggleRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<readonly string[]>(["alpha"]);
        return (
          <ToggleGroup
            multiple
            onValueChange={setValue}
            ref={(next) => {
              groupRef = next;
            }}
            value={value()}
          >
            <Toggle
              ref={(next) => {
                itemRef = next;
              }}
              value="alpha"
            />
            <Toggle id="beta" value="beta" />
          </ToggleGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const item = itemRef;
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable beta");
    await setup.waitFor(() => {
      const key = beta.groupKey;
      return key && group
        ? group.store.getItemState(key)?.available === true
        : false;
    });
    beta.press();
    await setup.waitFor(() => group?.value.includes("beta") ?? false);
    expect(group?.value).toEqual(["alpha", "beta"]);
    expect(groupRef).toBe(group);
    expect(itemRef).toBe(item);
  });

  it("releases controlled group ownership at the observed value", async () => {
    const requests: Array<readonly string[]> = [];
    let setValue: (value: readonly string[] | undefined) => void = () => {};
    let groupRef: ToggleGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, updateValue] = createSignal<
          readonly string[] | undefined
        >(["alpha"]);
        setValue = updateValue;
        return (
          <ToggleGroup
            onValueChange={(nextValue) => requests.push(nextValue)}
            ref={(group) => {
              groupRef = group;
            }}
            value={value()}
          >
            <Toggle id="ownership-alpha" value="alpha" />
            <Toggle id="ownership-beta" value="beta" />
          </ToggleGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("ownership-alpha");
    const beta = setup.renderer.root.findDescendantById("ownership-beta");
    if (!group) throw new Error("Expected ownership ToggleGroup");
    if (!(alpha instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable ownership-alpha");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable ownership-beta");

    beta.press();
    expect(requests).toEqual([["beta"]]);
    expect(group.value).toEqual(["alpha"]);

    setValue(["beta"]);
    await setup.waitFor(() => group.value[0] === "beta");
    setValue(undefined);
    await Promise.resolve();
    alpha.press();
    expect(group.value).toEqual(["alpha"]);
    expect(requests).toEqual([["beta"], ["alpha"]]);
  });

  it("reactively gates disabled and unavailable group interaction", async () => {
    const requests: Array<readonly string[]> = [];
    let enableGroup: () => void = () => {};
    let hideBeta: () => void = () => {};
    let groupRef: ToggleGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [disabled, setDisabled] = createSignal(true);
        const [betaVisible, setBetaVisible] = createSignal(true);
        enableGroup = () => setDisabled(false);
        hideBeta = () => setBetaVisible(false);
        return (
          <ToggleGroup
            disabled={disabled()}
            onValueChange={(value) => requests.push(value)}
            ref={(group) => {
              groupRef = group;
            }}
          >
            <Toggle id="disabled-alpha" value="alpha" />
            <Toggle id="disabled-beta" value="beta" visible={betaVisible()} />
          </ToggleGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("disabled-alpha");
    const beta = setup.renderer.root.findDescendantById("disabled-beta");
    if (!group) throw new Error("Expected disabled ToggleGroup");
    if (!(alpha instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable disabled-alpha");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable disabled-beta");

    alpha.focus();
    alpha.press();
    beta.press();
    expect(alpha.focused).toBe(false);
    expect(requests).toEqual([]);

    enableGroup();
    await setup.waitFor(() => !group.disabled);
    hideBeta();
    await setup.waitFor(() => !beta.visible);
    beta.press();
    expect(requests).toEqual([]);
    alpha.press();
    expect(group.value).toEqual(["alpha"]);
    expect(requests).toEqual([["alpha"]]);
  });

  it("replaces the group callback without replacing its Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    let groupRef: ToggleGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [replacement, setReplacement] = createSignal(false);
        replaceCallback = () => setReplacement(true);
        return (
          <ToggleGroup
            defaultValue={["alpha"]}
            onValueChange={
              replacement() ? () => calls.push("new") : () => calls.push("old")
            }
            ref={(value) => {
              groupRef = value;
            }}
          >
            <Toggle id="alpha-callback" value="alpha" />
            <Toggle id="beta-callback" value="beta" />
          </ToggleGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("alpha-callback");
    const beta = setup.renderer.root.findDescendantById("beta-callback");
    if (!group)
      throw new Error("Expected ToggleGroupRenderable callback target");
    if (!(alpha instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable alpha-callback");
    if (!(beta instanceof ToggleRenderable))
      throw new Error("Expected ToggleRenderable beta-callback");

    beta.press();
    replaceCallback();
    await Promise.resolve();
    alpha.press();

    expect(calls).toEqual(["old", "new"]);
    expect(groupRef).toBe(group);
  });

  it("unregisters conditional Toggles before remounting the same value", async () => {
    let setVisible: (visible: boolean) => void = () => {};
    const groupRefs: ToggleGroupRenderable[] = [];
    const itemRefs: ToggleRenderable[] = [];
    setup = await testRender(
      () => {
        const [visible, updateVisible] = createSignal(true);
        setVisible = updateVisible;
        return (
          <ToggleGroup ref={(value) => groupRefs.push(value)}>
            {visible() ? (
              <Toggle ref={(value) => itemRefs.push(value)} value="alpha" />
            ) : null}
          </ToggleGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const first = itemRefs.at(-1);
    if (!first) throw new Error("Expected initial lifecycle Toggle");
    const group = groupRefs.at(-1);
    if (!group) throw new Error("Expected lifecycle ToggleGroup");
    const firstKey = first.groupKey;
    if (!firstKey) throw new Error("Expected lifecycle Toggle registration");

    setVisible(false);
    await setup.waitFor(() => group.store.getItemState(firstKey) === undefined);
    setVisible(true);
    await setup.waitFor(() => itemRefs.at(-1) !== first);

    const replacement = itemRefs.at(-1);
    if (!replacement) throw new Error("Expected replacement lifecycle Toggle");
    expect(replacement).not.toBe(first);
    replacement.press();
    expect(group.value).toEqual(["alpha"]);
  });
});
