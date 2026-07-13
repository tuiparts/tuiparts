import { afterEach, describe, expect, it } from "bun:test";
import type { BaseRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { BadgeRenderable } from "@opentui-ui/core";
import { Badge, Button } from "@opentui-ui/react";
import { styled } from "@opentui-ui/react/styled";
import { act, createElement, Fragment, useState } from "react";
import { Input } from "./input/primitive";
import { Radio } from "./radio/radio";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  if (setup) await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

function countById(root: BaseRenderable, id: string): number {
  return (
    (root.id === id ? 1 : 0) +
    root.getChildren().reduce((count, child) => count + countById(child, id), 0)
  );
}

describe("React adapter", () => {
  it("keeps root props below authored slots regardless of prop order", async () => {
    const activeStyles = { root: { paddingLeft: 3 }, label: {} };
    const inactiveStyles = { root: {}, label: {} };
    const StyledBadge = styled(Badge, {
      base: { root: { paddingLeft: 3 } },
    });
    let setBaseline: (value: number | undefined) => void = () => {};
    let setOverride: (value: boolean) => void = () => {};

    function App() {
      const [baseline, updateBaseline] = useState<number | undefined>(2);
      const [override, updateOverride] = useState(true);
      setBaseline = updateBaseline;
      setOverride = updateOverride;

      const dynamicBadgeProps = {
        alignSelf: "flex-start" as const,
        id: "dynamic-badge",
        label: "X",
        styles: override ? activeStyles : inactiveStyles,
        ...(baseline === undefined ? {} : { paddingLeft: baseline }),
      };

      return createElement(
        Fragment,
        null,
        createElement(Badge, {
          alignSelf: "flex-start",
          id: "props-first",
          label: "X",
          paddingLeft: 2,
          styles: activeStyles,
        }),
        createElement(Badge, {
          alignSelf: "flex-start",
          id: "styles-first",
          label: "X",
          styles: activeStyles,
          paddingLeft: 2,
        }),
        createElement(Badge, dynamicBadgeProps),
        createElement(StyledBadge, {
          alignSelf: "flex-start",
          id: "styled-root",
          label: "X",
          paddingLeft: 2,
        }),
      );
    }

    setup = await testRender(createElement(App), { width: 30, height: 8 });
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

    await act(async () => setBaseline(4));
    await setup.waitFor(() => dynamicBadge.width === 5);

    await act(async () => setOverride(false));
    await setup.waitFor(() => dynamicBadge.width === 6);

    await act(async () => setBaseline(undefined));
    await setup.waitFor(() => dynamicBadge.width === 3);
  });

  it("registers the remaining packaged components and routes children", async () => {
    function App() {
      return createElement(
        Fragment,
        null,
        createElement(Badge, { id: "badge", label: "Badge" }),
        createElement(
          Button,
          { id: "button" },
          createElement("text", { content: "Button" }),
        ),
        createElement(Input, { id: "input", value: "Input" }),
        createElement(
          "box",
          { id: "radio-group" },
          createElement(Radio, { id: "radio", label: "Radio" }),
        ),
      );
    }

    setup = await testRender(createElement(App), { width: 40, height: 12 });
    const ids = ["badge", "button", "input", "radio-group", "radio"];
    expect(
      ids.filter((id) => !setup?.renderer.root.findDescendantById(id)),
    ).toEqual([]);

    expect(
      setup.renderer.root
        .findDescendantById("radio-group")
        ?.findDescendantById("radio"),
    ).toBeDefined();
  });

  it("flattens nested styled wrappers to one deepest base", async () => {
    const Inner = styled(Badge, {
      base: { root: { paddingX: 1 }, label: { color: "#00FF00" } },
    });
    const Outer = styled(Inner, {
      base: { root: { backgroundColor: "#112233" } },
    });

    setup = await testRender(
      createElement(Outer, {
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
