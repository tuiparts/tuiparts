/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  RadioGroupIndicatorRenderable,
  RadioGroupItemRenderable,
  RadioGroupItemState,
  RadioGroupRootRenderable,
  RadioGroupState,
} from "@opentui-ui/core/radio";
import { createSignal } from "solid-js";
import { RadioGroup } from "./index";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid RadioGroup", () => {
  it("composes parts with public state and keyboard navigation", async () => {
    let indicatorRef: RadioGroupIndicatorRenderable | undefined;
    let alphaRef: RadioGroupItemRenderable | undefined;
    setup = await testRender(
      () => (
        <RadioGroup.Root id="root" defaultValue="alpha">
          {(group: RadioGroupState) => (
            <>
              <text id="group-state" content={group.value ?? "none"} />
              <RadioGroup.Item
                id="alpha"
                value="alpha"
                ref={(value) => {
                  alphaRef = value;
                }}
              >
                {(item: RadioGroupItemState) => (
                  <>
                    <RadioGroup.Indicator
                      id="alpha-indicator"
                      ref={(value) => {
                        indicatorRef = value;
                      }}
                    >
                      <text content="x" />
                    </RadioGroup.Indicator>
                    <text
                      id="alpha-state"
                      content={`${item.selected ? "on" : "off"}:${item.focused ? "focused" : "blurred"}:${item.available ? "available" : "unavailable"}:${item.tabbable ? "tabbable" : "untabbable"}`}
                    />
                  </>
                )}
              </RadioGroup.Item>
              <RadioGroup.Item id="beta" value="beta" />
            </>
          )}
        </RadioGroup.Root>
      ),
      { width: 30, height: 6 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as RadioGroupRootRenderable;
    const alpha = alphaRef;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioGroupItemRenderable;
    expect(alpha).toBeDefined();
    if (!alpha) throw new Error("alpha Item ref was not assigned");

    await setup.waitFor(() => alpha.getState().available);
    expect(textContent("group-state")).toBe("alpha");
    expect(textContent("alpha-state")).toBe("on:blurred:available:tabbable");
    expect(setup.renderer.root.findDescendantById("alpha-indicator")).toBe(
      indicatorRef,
    );
    expect(root.store.getItemState(alpha.key)).toEqual({
      value: "alpha",
      available: true,
      disabled: false,
      selected: true,
      tabbable: true,
    });

    alpha.focus();
    await setup.waitFor(() => textContent("alpha-state").includes("focused"));
    await setup.mockInput.pressArrow("down");
    await setup.waitFor(() => textContent("group-state") === "beta");

    expect(root.value).toBe("beta");
    expect(beta.focused).toBe(true);
    expect(textContent("alpha-state")).toBe("off:blurred:available:untabbable");
    expect(
      setup.renderer.root.findDescendantById("alpha-indicator"),
    ).toBeUndefined();
  });

  it("reactively updates disabled props on a retained group", async () => {
    let setGroupDisabled: (disabled: boolean) => void = () => {};
    let setItemDisabled: (disabled: boolean) => void = () => {};
    setup = await testRender(
      () => {
        const [groupDisabled, updateGroupDisabled] = createSignal(false);
        const [itemDisabled, updateItemDisabled] = createSignal(true);
        setGroupDisabled = updateGroupDisabled;
        setItemDisabled = updateItemDisabled;
        return (
          <RadioGroup.Root
            id="uncontrolled-root"
            defaultValue="alpha"
            disabled={groupDisabled()}
          >
            <RadioGroup.Item id="alpha" value="alpha" />
            <RadioGroup.Item
              id="uncontrolled-beta"
              value="beta"
              disabled={itemDisabled()}
            />
          </RadioGroup.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "uncontrolled-root",
    ) as RadioGroupRootRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "uncontrolled-beta",
    ) as RadioGroupItemRenderable;

    beta.press();
    expect(root.value).toBe("alpha");
    setItemDisabled(false);
    await setup.waitFor(() => !beta.disabled);
    setGroupDisabled(true);
    await setup.waitFor(() => root.disabled && beta.disabled);
    setGroupDisabled(false);
    await setup.waitFor(() => !root.disabled && !beta.disabled);
    beta.press();
    expect(root.value).toBe("beta");
    expect(setup.renderer.root.findDescendantById("uncontrolled-root")).toBe(
      root,
    );
  });

  it("reactively updates controlled props and retains identities", async () => {
    let setItemValue: (value: string) => void = () => {};
    let rootRef: RadioGroupRootRenderable | undefined;
    let itemRef: RadioGroupItemRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<string | null>("alpha");
        const [itemValue, updateItemValue] = createSignal("alpha");
        setItemValue = updateItemValue;
        return (
          <RadioGroup.Root
            id="controlled-root"
            value={value()}
            onValueChange={setValue}
            ref={(next) => {
              rootRef = next;
            }}
          >
            <RadioGroup.Item
              id="controlled-item"
              value={itemValue()}
              ref={(next) => {
                itemRef = next;
              }}
            />
            <RadioGroup.Item id="beta" value="beta" />
          </RadioGroup.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const root = rootRef;
    const item = itemRef;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioGroupItemRenderable;
    expect(root).toBeDefined();
    expect(item).toBeDefined();

    beta.press();
    await setup.waitFor(() => root?.value === "beta");
    setItemValue("renamed");
    await setup.waitFor(() => item?.value === "renamed");
    expect(setup.renderer.root.findDescendantById("controlled-root")).toBe(
      root,
    );
    expect(setup.renderer.root.findDescendantById("controlled-item")).toBe(
      item,
    );
  });

  it("clears removed controlled and disabled props", async () => {
    let removeProps: () => void = () => {};
    const changes: string[] = [];
    setup = await testRender(
      () => {
        const [withProps, setWithProps] = createSignal(true);
        removeProps = () => setWithProps(false);
        const rootProps = () =>
          withProps()
            ? {
                value: "alpha",
                onValueChange: (value: string) => changes.push(value),
              }
            : {};
        const itemProps = () => (withProps() ? { disabled: true } : {});
        return (
          <RadioGroup.Root id="removal-root" {...rootProps()}>
            <RadioGroup.Item id="alpha" value="alpha" />
            <RadioGroup.Item id="removal-beta" value="beta" {...itemProps()} />
          </RadioGroup.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "removal-root",
    ) as RadioGroupRootRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "removal-beta",
    ) as RadioGroupItemRenderable;

    removeProps();
    await setup.waitFor(() => !beta.disabled);
    beta.press();

    expect(root.value).toBe("beta");
    expect(changes).toEqual([]);
  });

  it("registers and unregisters dynamic compiled Item JSX", async () => {
    let setVisible: (visible: boolean) => void = () => {};
    setup = await testRender(
      () => {
        const [visible, updateVisible] = createSignal(true);
        setVisible = updateVisible;
        return (
          <RadioGroup.Root id="dynamic-root">
            <RadioGroup.Item id="fallback-item" value="fallback" />
            {visible() ? (
              <RadioGroup.Item id="dynamic-item" value="dynamic">
                <RadioGroup.Indicator id="dynamic-indicator" keepMounted />
              </RadioGroup.Item>
            ) : null}
          </RadioGroup.Root>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "dynamic-root",
    ) as RadioGroupRootRenderable;
    const item = setup.renderer.root.findDescendantById(
      "dynamic-item",
    ) as RadioGroupItemRenderable;
    const fallback = setup.renderer.root.findDescendantById(
      "fallback-item",
    ) as RadioGroupItemRenderable;
    const indicator = setup.renderer.root.findDescendantById(
      "dynamic-indicator",
    ) as RadioGroupIndicatorRenderable;
    const key = item.key;

    expect(root.store.getItemState(key)).toBeDefined();
    expect(indicator.visible).toBe(false);
    item.focus();
    setVisible(false);
    await setup.waitFor(
      () => root.store.getItemState(key) === undefined && fallback.focused,
    );
    expect(
      setup.renderer.root.findDescendantById("dynamic-item"),
    ).toBeUndefined();
    expect(indicator.getState().selected).toBe(false);
  });
});
