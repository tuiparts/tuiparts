/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { RadioRootRenderable } from "@tuiparts/core/radio";
import type { RadioGroupRenderable } from "@tuiparts/core/radio-group";
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

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid RadioGroup recipe runtime smoke", async () => {
  let rootRef: RadioGroupRenderable | undefined;

  setup = await testRender(
    () => (
      <RadioGroup
        id="uncontrolled"
        defaultValue="alpha"
        ref={(value) => {
          rootRef = value;
        }}
      >
        <RadioGroupItem id="alpha" value="alpha" label="Alpha" mark="x" />
        <RadioGroupItem id="omega" value="omega" label="Omega" />
      </RadioGroup>
    ),
    { width: 30, height: 4 },
  );
  await setup.renderOnce();

  expect(rootRef).toBeDefined();
  const alpha = item("alpha");
  expect(rootRef?.value).toBe("alpha");
  expect(text(alpha)).toEqual(["x", "Alpha"]);

  item("omega").press();
  await setup.waitFor(() => rootRef?.value === "omega");
  expect(text(alpha)).toEqual(["Alpha"]);
});

test("restyles rendered items on theme switch", async () => {
  theme.register("smoke", {
    tokens: { colors: { primary: "#123456" }, glyphs: { radio: "*" } },
  });
  setup = await testRender(
    () => (
      <RadioGroup id="themed" defaultValue="alpha">
        <RadioGroupItem id="themed-alpha" value="alpha" label="Alpha" />
      </RadioGroup>
    ),
    { width: 30, height: 3 },
  );
  await setup.renderOnce();
  const alpha = item("themed-alpha");
  expect(text(alpha)).toEqual(["●", "Alpha"]);

  theme.setActive("smoke");
  await setup.waitFor(() => text(alpha).join(" ") === "* Alpha");

  expect(setup.renderer.root.findDescendantById("themed-alpha")).toBe(alpha);
  theme.setActive("terminal");
});
