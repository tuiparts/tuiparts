/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type {
  RadioGroupItemRenderable,
  RadioGroupRootRenderable,
} from "@opentui-ui/core/radio";
import { act, createRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";

let setup: TestRendererSetup | undefined;

function root(id: string): RadioGroupRootRenderable {
  return setup?.renderer.root.findDescendantById(
    id,
  ) as RadioGroupRootRenderable;
}

function item(id: string): RadioGroupItemRenderable {
  return setup?.renderer.root.findDescendantById(
    id,
  ) as RadioGroupItemRenderable;
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
    const rootRef = createRef<RadioGroupRootRenderable>();
    const retainedRef = createRef<RadioGroupItemRenderable>();
    const dynamicRef = createRef<RadioGroupItemRenderable>();
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
    await setup.waitFor(() => gamma.focused && gamma.selected);
    expect(root("uncontrolled").value).toBe("gamma");
    expect(item("beta").selected).toBe(false);
    expect(text(gamma)).toEqual(["*", "Gamma"]);

    await act(async () => setup?.mockInput.pressArrow("right"));
    await setup.waitFor(() => item("dynamic").focused);
    await act(async () => setup?.mockInput.pressArrow("down"));
    await setup.waitFor(() => alpha.focused && alpha.selected);

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
    const rootRef = createRef<RadioGroupRootRenderable>();
    const itemRef = createRef<RadioGroupItemRenderable>();

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

    expect(item("controlled-beta").selected).toBe(true);
    expect(rootRef.current).toBe(retainedRoot);
    expect(itemRef.current).toBe(retainedItem);
  });
});
