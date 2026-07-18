/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type {
  RadioIndicatorRenderable,
  RadioRootRenderable,
  RadioState,
} from "@tuiparts/core/radio";
import type {
  RadioGroupRenderable,
  RadioGroupState,
} from "@tuiparts/core/radio-group";
import { createSignal } from "solid-js";
import { RadioGroup } from "../radio-group";
import { Radio } from "./index";

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
  it("rejects Radio.Root without RadioGroup ownership", async () => {
    await expect(
      testRender(() => <Radio.Root value="orphan" />, {
        width: 30,
        height: 5,
      }),
    ).rejects.toThrow("Radio.Root must be rendered inside RadioGroup");
  });

  it("composes parts with public state and a single selection round-trip", async () => {
    let indicatorRef: RadioIndicatorRenderable | undefined;
    let alphaRef: RadioRootRenderable | undefined;
    setup = await testRender(
      () => (
        <RadioGroup id="root" defaultValue="alpha">
          {(group: RadioGroupState) => (
            <>
              <text id="group-state" content={group.value ?? "none"} />
              <Radio.Root
                id="alpha"
                value="alpha"
                ref={(value) => {
                  alphaRef = value;
                }}
              >
                {(item: RadioState) => (
                  <>
                    <Radio.Indicator
                      id="alpha-indicator"
                      ref={(value) => {
                        indicatorRef = value;
                      }}
                    >
                      <text content="x" />
                    </Radio.Indicator>
                    <text
                      id="alpha-state"
                      content={`${item.checked ? "on" : "off"}:${item.focused ? "focused" : "blurred"}:${item.available ? "available" : "unavailable"}:${item.tabbable ? "tabbable" : "untabbable"}`}
                    />
                  </>
                )}
              </Radio.Root>
              <Radio.Root id="beta" value="beta" />
            </>
          )}
        </RadioGroup>
      ),
      { width: 30, height: 6 },
    );
    const root = setup.renderer.root.findDescendantById(
      "root",
    ) as RadioGroupRenderable;
    const alpha = alphaRef;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioRootRenderable;
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
      checked: true,
      tabbable: true,
    });

    // One selection round-trip: pressing beta updates the group value.
    beta.press();
    await setup.waitFor(() => root.value === "beta");
    expect(root.value).toBe("beta");
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
          <RadioGroup
            id="uncontrolled-root"
            defaultValue="alpha"
            disabled={groupDisabled()}
          >
            <Radio.Root id="alpha" value="alpha" />
            <Radio.Root
              id="uncontrolled-beta"
              value="beta"
              disabled={itemDisabled()}
            />
          </RadioGroup>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "uncontrolled-root",
    ) as RadioGroupRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "uncontrolled-beta",
    ) as RadioRootRenderable;
    expect(beta.disabled).toBe(true);

    // Reactive group and item disabled propagation, then prop removal.
    setItemDisabled(false);
    await setup.waitFor(() => !beta.disabled);
    setGroupDisabled(true);
    await setup.waitFor(() => root.disabled && beta.disabled);
    setGroupDisabled(false);
    await setup.waitFor(() => !root.disabled && !beta.disabled);

    // One selection round-trip on the re-enabled retained group.
    beta.press();
    expect(root.value).toBe("beta");
    expect(setup.renderer.root.findDescendantById("uncontrolled-root")).toBe(
      root,
    );
  });

  it("reactively updates controlled props and retains identities", async () => {
    let setItemValue: (value: string) => void = () => {};
    let rootRef: RadioGroupRenderable | undefined;
    let itemRef: RadioRootRenderable | undefined;
    setup = await testRender(
      () => {
        const [value, setValue] = createSignal<string | null>("alpha");
        const [itemValue, updateItemValue] = createSignal("alpha");
        setItemValue = updateItemValue;
        return (
          <RadioGroup
            id="controlled-root"
            value={value()}
            onValueChange={setValue}
            ref={(next) => {
              rootRef = next;
            }}
          >
            <Radio.Root
              id="controlled-item"
              value={itemValue()}
              ref={(next) => {
                itemRef = next;
              }}
            />
            <Radio.Root id="beta" value="beta" />
          </RadioGroup>
        );
      },
      { width: 30, height: 5 },
    );
    const root = rootRef;
    const item = itemRef;
    const beta = setup.renderer.root.findDescendantById(
      "beta",
    ) as RadioRootRenderable;
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
          <RadioGroup id="removal-root" {...rootProps()}>
            <Radio.Root id="alpha" value="alpha" />
            <Radio.Root id="removal-beta" value="beta" {...itemProps()} />
          </RadioGroup>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "removal-root",
    ) as RadioGroupRenderable;
    const beta = setup.renderer.root.findDescendantById(
      "removal-beta",
    ) as RadioRootRenderable;

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
          <RadioGroup id="dynamic-root">
            <Radio.Root id="fallback-item" value="fallback" />
            {visible() ? (
              <Radio.Root id="dynamic-item" value="dynamic">
                <Radio.Indicator id="dynamic-indicator" keepMounted />
              </Radio.Root>
            ) : null}
          </RadioGroup>
        );
      },
      { width: 30, height: 5 },
    );
    const root = setup.renderer.root.findDescendantById(
      "dynamic-root",
    ) as RadioGroupRenderable;
    const item = setup.renderer.root.findDescendantById(
      "dynamic-item",
    ) as RadioRootRenderable;
    const indicator = setup.renderer.root.findDescendantById(
      "dynamic-indicator",
    ) as RadioIndicatorRenderable;
    const key = item.key;

    expect(root.store.getItemState(key)).toBeDefined();
    expect(indicator.visible).toBe(false);

    setVisible(false);
    await setup.waitFor(() => root.store.getItemState(key) === undefined);
    expect(
      setup.renderer.root.findDescendantById("dynamic-item"),
    ).toBeUndefined();
  });
});
