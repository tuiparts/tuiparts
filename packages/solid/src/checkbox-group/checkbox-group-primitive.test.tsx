/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  CheckboxRootRenderable,
  type CheckboxState,
} from "@tuiparts/core/checkbox";
import {
  CheckboxGroupRenderable,
  CheckboxGroupStore,
} from "@tuiparts/core/checkbox-group";
import { createSignal } from "solid-js";
import { Checkbox } from "../checkbox";
import { CheckboxGroup } from "./index";

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

describe("Solid CheckboxGroup", () => {
  it("provides grouped state with a single checkbox round-trip", async () => {
    setup = await testRender(
      () => (
        <CheckboxGroup defaultValue={["left"]} id="group">
          <Checkbox.Root id="left" value="left">
            {(state: CheckboxState) => (
              <text
                content={state.checked ? "checked" : "idle"}
                id="left-state"
              />
            )}
          </Checkbox.Root>
          <Checkbox.Root id="right" value="right" />
        </CheckboxGroup>
      ),
      { width: 30, height: 4 },
    );
    const group = setup.renderer.root.findDescendantById("group");
    const right = setup.renderer.root.findDescendantById("right");
    if (!(group instanceof CheckboxGroupRenderable))
      throw new Error("Expected CheckboxGroupRenderable group");
    if (!(right instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable right");

    expect(textContent("left-state")).toBe("checked");
    expect(group.value).toEqual(["left"]);

    right.press();
    await setup.waitFor(() => group.value.includes("right"));
    expect(group.value).toEqual(["left", "right"]);
  });

  it("reactively updates controlled values without replacing Renderables", async () => {
    let groupRef: CheckboxGroupRenderable | undefined;
    let itemRef: CheckboxRootRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<readonly string[]>(["alpha"]);
        return (
          <CheckboxGroup
            onValueChange={setValue}
            ref={(next) => {
              groupRef = next;
            }}
            value={value()}
          >
            <Checkbox.Root
              ref={(next) => {
                itemRef = next;
              }}
              value="alpha"
            />
            <Checkbox.Root id="beta" value="beta" />
          </CheckboxGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const item = itemRef;
    const beta = setup.renderer.root.findDescendantById("beta");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable beta");
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
    let groupRef: CheckboxGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, updateValue] = createSignal<
          readonly string[] | undefined
        >(["alpha"]);
        setValue = updateValue;
        return (
          <CheckboxGroup
            onValueChange={(nextValue) => requests.push(nextValue)}
            ref={(group) => {
              groupRef = group;
            }}
            value={value()}
          >
            <Checkbox.Root id="ownership-alpha" value="alpha" />
            <Checkbox.Root id="ownership-beta" value="beta" />
          </CheckboxGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("ownership-alpha");
    const beta = setup.renderer.root.findDescendantById("ownership-beta");
    if (!group) throw new Error("Expected ownership CheckboxGroup");
    if (!(alpha instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable ownership-alpha");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable ownership-beta");

    // The change callback fires while controlled.
    beta.press();
    expect(requests).toEqual([["alpha", "beta"]]);

    // Controlled prop commits through the Store.
    setValue(["beta"]);
    await setup.waitFor(() => group.value[0] === "beta");

    // Prop removal: clearing the controlled value releases ownership.
    setValue(undefined);
    await Promise.resolve();
    alpha.press();
    expect(group.value).toEqual(["beta", "alpha"]);
    expect(requests).toEqual([
      ["alpha", "beta"],
      ["beta", "alpha"],
    ]);
  });

  it("reactively propagates disabled and visible props on a retained group", async () => {
    const requests: Array<readonly string[]> = [];
    let enableGroup: () => void = () => {};
    let hideBeta: () => void = () => {};
    let groupRef: CheckboxGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [disabled, setDisabled] = createSignal(true);
        const [betaVisible, setBetaVisible] = createSignal(true);
        enableGroup = () => setDisabled(false);
        hideBeta = () => setBetaVisible(false);
        return (
          <CheckboxGroup
            disabled={disabled()}
            onValueChange={(value) => requests.push(value)}
            ref={(group) => {
              groupRef = group;
            }}
          >
            <Checkbox.Root id="disabled-alpha" value="alpha" />
            <Checkbox.Root
              id="disabled-beta"
              value="beta"
              visible={betaVisible()}
            />
          </CheckboxGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("disabled-alpha");
    const beta = setup.renderer.root.findDescendantById("disabled-beta");
    if (!group) throw new Error("Expected disabled CheckboxGroup");
    if (!(alpha instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable disabled-alpha");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable disabled-beta");
    expect(group.disabled).toBe(true);

    // Reactive disabled and visible prop propagation.
    enableGroup();
    await setup.waitFor(() => !group.disabled);
    hideBeta();
    await setup.waitFor(() => !beta.visible);

    // One selection round-trip on the re-enabled group.
    alpha.press();
    expect(group.value).toEqual(["alpha"]);
    expect(requests).toEqual([["alpha"]]);
  });

  it("replaces the group callback without replacing its Renderable", async () => {
    const calls: string[] = [];
    let replaceCallback: () => void = () => {};
    let groupRef: CheckboxGroupRenderable | undefined;
    setup = await testRender(
      () => {
        const [replacement, setReplacement] = createSignal(false);
        replaceCallback = () => setReplacement(true);
        return (
          <CheckboxGroup
            defaultValue={["alpha"]}
            onValueChange={
              replacement() ? () => calls.push("new") : () => calls.push("old")
            }
            ref={(value) => {
              groupRef = value;
            }}
          >
            <Checkbox.Root id="alpha-callback" value="alpha" />
            <Checkbox.Root id="beta-callback" value="beta" />
          </CheckboxGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const group = groupRef;
    const alpha = setup.renderer.root.findDescendantById("alpha-callback");
    const beta = setup.renderer.root.findDescendantById("beta-callback");
    if (!group)
      throw new Error("Expected CheckboxGroupRenderable callback target");
    if (!(alpha instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable alpha-callback");
    if (!(beta instanceof CheckboxRootRenderable))
      throw new Error("Expected CheckboxRootRenderable beta-callback");

    beta.press();
    replaceCallback();
    await Promise.resolve();
    alpha.press();

    expect(calls).toEqual(["old", "new"]);
    expect(groupRef).toBe(group);
  });

  it("releases group subscriptions on teardown", async () => {
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
        () => (
          <CheckboxGroup>
            <Checkbox.Root value="alpha">
              <Checkbox.Indicator />
            </Checkbox.Root>
          </CheckboxGroup>
        ),
        { width: 20, height: 3 },
      );
      expect(activeSubscriptions).toBeGreaterThan(0);
      setup.renderer.destroy();
      setup = undefined;
      expect(activeSubscriptions).toBe(0);
    } finally {
      CheckboxGroupStore.prototype.subscribe = originalSubscribe;
    }
  });

  it("unregisters conditional Checkboxes before remounting the same value", async () => {
    let setVisible: (visible: boolean) => void = () => {};
    const groupRefs: CheckboxGroupRenderable[] = [];
    const itemRefs: CheckboxRootRenderable[] = [];
    setup = await testRender(
      () => {
        const [visible, updateVisible] = createSignal(true);
        setVisible = updateVisible;
        return (
          <CheckboxGroup ref={(value) => groupRefs.push(value)}>
            {visible() ? (
              <Checkbox.Root
                ref={(value) => itemRefs.push(value)}
                value="alpha"
              />
            ) : null}
          </CheckboxGroup>
        );
      },
      { width: 30, height: 4 },
    );
    const first = itemRefs.at(-1);
    if (!first) throw new Error("Expected initial lifecycle Checkbox");
    const group = groupRefs.at(-1);
    if (!group) throw new Error("Expected lifecycle CheckboxGroup");
    const firstKey = first.groupKey;
    if (!firstKey) throw new Error("Expected lifecycle Checkbox registration");

    setVisible(false);
    await setup.waitFor(() => group.store.getItemState(firstKey) === undefined);
    setVisible(true);
    await setup.waitFor(() => itemRefs.at(-1) !== first);

    const replacement = itemRefs.at(-1);
    if (!replacement)
      throw new Error("Expected replacement lifecycle Checkbox");
    expect(replacement).not.toBe(first);
    replacement.press();
    expect(group.value).toEqual(["alpha"]);
  });
});
