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
import { act, createRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

function root(id: string): RadioGroupRenderable {
  return setup?.renderer.root.findDescendantById(id) as RadioGroupRenderable;
}

function item(id: string): RadioRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as RadioRootRenderable;
}

function text(node: BaseRenderable): string[] {
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

function frameLines(): string[] {
  return (
    setup
      ?.captureCharFrame()
      .split("\n")
      .map((line) => line.trimEnd()) ?? []
  );
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React RadioGroup recipe", () => {
  it("runs the collection behavior through consumer-owned presentation", async () => {
    const rootRef = createRef<RadioGroupRenderable>();
    const retainedRef = createRef<RadioRootRenderable>();
    const dynamicRef = createRef<RadioRootRenderable>();
    let removeDynamic: (() => void) | undefined;

    function Uncontrolled() {
      const [showDynamic, setShowDynamic] = useState(true);
      removeDynamic = () => setShowDynamic(false);
      return (
        <RadioGroup id="uncontrolled" defaultValue="alpha" ref={rootRef}>
          <RadioGroupItem
            id="alpha"
            value="alpha"
            label="Alpha"
            ref={retainedRef}
          />
          <RadioGroupItem id="beta" value="beta" label="Beta" disabled />
          <RadioGroupItem
            id="gamma"
            value="gamma"
            label="Gamma"
            mark="*"
            tone="success"
          />
          {showDynamic ? (
            <RadioGroupItem
              id="dynamic"
              value="dynamic"
              label="Dynamic"
              ref={dynamicRef}
            />
          ) : null}
        </RadioGroup>
      );
    }

    setup = await testRender(<Uncontrolled />, { width: 30, height: 8 });
    await act(async () => setup?.renderOnce());
    const retainedRoot = rootRef.current;
    const retainedItem = retainedRef.current;
    const alpha = item("alpha");
    const gamma = item("gamma");

    expect(root("uncontrolled").value).toBe("alpha");
    expect(text(alpha)).toEqual(["●", "Alpha"]);
    expect(frameLines().slice(0, 4)).toEqual([
      "● Alpha",
      "  Beta",
      "  Gamma",
      "  Dynamic",
    ]);

    await act(async () => alpha.focus());
    await act(async () => setup?.mockInput.pressArrow("down"));
    await setup.waitFor(() => gamma.focused && gamma.checked);
    expect(root("uncontrolled").value).toBe("gamma");
    expect(item("beta").checked).toBe(false);
    expect(text(gamma)).toEqual(["*", "Gamma"]);

    await act(async () => setup?.mockInput.pressArrow("right"));
    await setup.waitFor(() => item("dynamic").focused);
    await act(async () => setup?.mockInput.pressArrow("down"));
    await setup.waitFor(() => alpha.focused && alpha.checked);

    await act(async () => setup?.mockInput.pressKey("END"));
    await setup.waitFor(() => item("dynamic").focused);
    await act(async () => setup?.mockInput.pressKey("HOME"));
    await setup.waitFor(() => alpha.focused);

    await act(async () => dynamicRef.current?.focus());
    await act(async () => removeDynamic?.());
    await setup.waitFor(
      () => dynamicRef.current === null && item("gamma").focused,
    );

    expect(rootRef.current).toBe(retainedRoot);
    expect(retainedRef.current).toBe(retainedItem);
  });

  it("applies controlled owner updates without replacing parts", async () => {
    const rootRef = createRef<RadioGroupRenderable>();
    const itemRef = createRef<RadioRootRenderable>();

    function Controlled() {
      const [value, setValue] = useState<string | null>("alpha");
      return (
        <RadioGroup
          id="controlled"
          value={value}
          onValueChange={setValue}
          ref={rootRef}
        >
          <RadioGroupItem
            id="controlled-alpha"
            value="alpha"
            label="Alpha"
            ref={itemRef}
          />
          <RadioGroupItem id="controlled-beta" value="beta" label="Beta" />
        </RadioGroup>
      );
    }

    setup = await testRender(<Controlled />, { width: 30, height: 4 });
    await act(async () => setup?.renderOnce());
    const retainedRoot = rootRef.current;
    const retainedItem = itemRef.current;

    await act(async () => item("controlled-beta").press());
    await setup.waitFor(() => root("controlled").value === "beta");

    expect(item("controlled-beta").checked).toBe(true);
    expect(rootRef.current).toBe(retainedRoot);
    expect(itemRef.current).toBe(retainedItem);
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
