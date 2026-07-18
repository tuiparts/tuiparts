/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import {
  type BaseRenderable,
  type BoxRenderable,
  parseColor,
  TextRenderable,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { RadioRootRenderable } from "@tuiparts/core/radio";
import type { RadioGroupRenderable } from "@tuiparts/core/radio-group";
import { act, createRef } from "react";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

function item(id: string): RadioRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as RadioRootRenderable;
}

function text(node: BaseRenderable): string[] {
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React RadioGroup recipe", () => {
  it("runs the collection behavior through consumer-owned presentation", async () => {
    const rootRef = createRef<RadioGroupRenderable>();

    setup = await testRender(
      <RadioGroup id="uncontrolled" defaultValue="alpha" ref={rootRef}>
        <RadioGroupItem id="alpha" value="alpha" label="Alpha" />
        <RadioGroupItem
          id="gamma"
          value="gamma"
          label="Gamma"
          mark="*"
          tone="success"
        />
      </RadioGroup>,
      { width: 30, height: 4 },
    );
    await act(async () => setup?.renderOnce());
    const alpha = item("alpha");
    const gamma = item("gamma");

    expect(rootRef.current?.value).toBe("alpha");
    expect(text(alpha)).toEqual(["●", "Alpha"]);

    await act(async () => gamma.press());
    await setup.waitFor(() => gamma.checked);
    expect(rootRef.current?.value).toBe("gamma");
    expect(text(gamma)).toEqual(["*", "Gamma"]);
  });

  it("restyles rendered items on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
    setup = await testRender(
      <RadioGroup id="themed" defaultValue="alpha">
        <RadioGroupItem id="themed-alpha" value="alpha" label="Alpha" />
      </RadioGroup>,
      { width: 30, height: 3 },
    );
    await act(async () => setup?.renderOnce());
    const alpha = item("themed-alpha");
    expect(text(alpha)).toEqual(["●", "Alpha"]);

    await act(async () => {
      theme.setActive("smoke");
    });
    await setup.waitFor(() => {
      const markCell = item("themed-alpha").getChildren()[0] as BoxRenderable;
      const indicator = markCell.getChildren()[0] as BoxRenderable;
      const mark = indicator.getChildren()[0] as TextRenderable;
      return mark.fg.equals(parseColor("#123456"));
    });

    expect(setup.renderer.root.findDescendantById("themed-alpha")).toBe(alpha);
    await act(async () => {
      theme.setActive("terminal");
    });
  });
});
