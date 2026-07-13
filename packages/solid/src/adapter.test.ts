import { afterEach, describe, expect, it } from "bun:test";
import type { BaseRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { createElement, testRender } from "@opentui/solid";
import type { BadgeRenderable } from "@opentui-ui/core";
import { Badge, Button } from "@opentui-ui/solid";
import { styled } from "@opentui-ui/solid/styled";
import { createSignal } from "solid-js";
import { Input } from "./input/primitive";
import { Radio } from "./radio/radio";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function countById(root: BaseRenderable, id: string): number {
  return (
    (root.id === id ? 1 : 0) +
    root.getChildren().reduce((count, child) => count + countById(child, id), 0)
  );
}

describe("Solid adapter", () => {
  it("keeps root props below authored slots regardless of prop order", async () => {
    const activeStyles = { root: { paddingLeft: 3 }, label: {} };
    const inactiveStyles = { root: {}, label: {} };
    const StyledBadge = styled(Badge, {
      base: { root: { paddingLeft: 3 } },
    });
    let setBaseline: (value: number | undefined) => void = () => {};
    let setOverride: (value: boolean) => void = () => {};

    setup = await testRender(
      () => {
        const [baseline, updateBaseline] = createSignal<number | undefined>(2);
        const [override, updateOverride] = createSignal(true);
        setBaseline = updateBaseline;
        setOverride = updateOverride;

        const root = createElement("box") as BaseRenderable;
        root.add(
          Badge({
            alignSelf: "flex-start",
            id: "props-first",
            label: "X",
            paddingLeft: 2,
            styles: activeStyles,
          }),
        );
        root.add(
          Badge({
            alignSelf: "flex-start",
            id: "styles-first",
            label: "X",
            styles: activeStyles,
            paddingLeft: 2,
          }),
        );
        root.add(
          Badge({
            alignSelf: "flex-start",
            get paddingLeft() {
              return baseline();
            },
            id: "dynamic-badge",
            label: "X",
            get styles() {
              return override() ? activeStyles : inactiveStyles;
            },
          }),
        );
        root.add(
          StyledBadge({
            alignSelf: "flex-start",
            id: "styled-root",
            label: "X",
            paddingLeft: 2,
          }),
        );
        return root;
      },
      { width: 30, height: 8 },
    );
    await setup.renderOnce();

    const root = setup.renderer.root;
    const propsFirst = root.findDescendantById(
      "props-first",
    ) as BadgeRenderable;
    const stylesFirst = root.findDescendantById(
      "styles-first",
    ) as BadgeRenderable;
    const dynamicBadge = root.findDescendantById(
      "dynamic-badge",
    ) as BadgeRenderable;
    const styledRoot = root.findDescendantById(
      "styled-root",
    ) as BadgeRenderable;

    expect(propsFirst.width).toBe(5);
    expect(stylesFirst.width).toBe(5);
    expect(dynamicBadge.width).toBe(5);
    expect(styledRoot.width).toBe(5);

    setBaseline(4);
    await setup.waitFor(() => dynamicBadge.width === 5);

    setOverride(false);
    await setup.waitFor(() => dynamicBadge.width === 6);

    setBaseline(undefined);
    await setup.waitFor(() => dynamicBadge.width === 3);
  });

  it("registers the remaining packaged components and preserves children", async () => {
    setup = await testRender(
      () => {
        const root = createElement("box") as BaseRenderable;
        root.add(Badge({ id: "badge", label: "Badge" }));
        root.add(Button({ id: "button" }));
        root.add(Input({ id: "input", value: "Input" }));
        root.add(Radio({ id: "radio", label: "Radio" }));
        return root;
      },
      { width: 40, height: 12 },
    );

    const ids = ["badge", "button", "input", "radio"];
    expect(
      ids.filter((id) => !setup?.renderer.root.findDescendantById(id)),
    ).toEqual([]);
  });

  it("flattens nested styled wrappers to one deepest base", async () => {
    const Inner = styled(Badge, {
      base: { root: { paddingX: 1 }, label: { color: "#00FF00" } },
    });
    const Outer = styled(Inner, {
      base: { root: { backgroundColor: "#112233" } },
    });

    setup = await testRender(
      () =>
        Outer({
          alignSelf: "flex-start",
          id: "styled-badge",
          label: "V1",
        }),
      { width: 20, height: 5 },
    );
    await setup.renderOnce();

    const badge = setup.renderer.root.findDescendantById(
      "styled-badge",
    ) as BadgeRenderable;
    expect(countById(setup.renderer.root, "styled-badge")).toBe(1);
    expect(badge.width).toBe(4);
    expect(badge.backgroundColor.toInts()).toEqual([17, 34, 51, 255]);
  });
});
