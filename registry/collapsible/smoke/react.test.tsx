/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  CollapsiblePanelRenderable,
  CollapsibleTriggerRenderable,
} from "@tuiparts/core/collapsible";
import { act } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

function text(node: BaseRenderable): string[] {
  if (!node.visible) return [];
  return [
    ...(node instanceof TextRenderable ? [node.plainText] : []),
    ...node.getChildren().flatMap(text),
  ];
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
  theme.setActive("terminal");
});

test("installed React Collapsible Recipe runtime smoke", async () => {
  setup = await testRender(
    <Collapsible id="root">
      <CollapsibleTrigger id="trigger" label="Details" />
      <CollapsibleContent id="content">
        <text content="Content" />
      </CollapsibleContent>
    </Collapsible>,
    { width: 30, height: 5 },
  );
  const trigger = setup.renderer.root.findDescendantById("trigger");
  if (!(trigger instanceof CollapsibleTriggerRenderable)) {
    throw new Error("Expected Collapsible Trigger");
  }
  expect(text(trigger)).toEqual(["›", "Details"]);
  expect(setup.renderer.root.findDescendantById("content")).toBeUndefined();

  await act(async () => trigger.press());
  await setup.waitFor(() =>
    Boolean(setup?.renderer.root.findDescendantById("content")),
  );

  expect(text(trigger)).toEqual(["⌄", "Details"]);
  expect(setup.renderer.root.findDescendantById("content")).toBeInstanceOf(
    CollapsiblePanelRenderable,
  );
});

test("restyles a retained React Collapsible on Theme switch", async () => {
  theme.register("smoke", {
    tokens: { colors: { primary: "#123456" } },
  });
  setup = await testRender(
    <Collapsible defaultOpen>
      <CollapsibleTrigger id="trigger" label="Theme" />
      <CollapsibleContent keepMounted />
    </Collapsible>,
    { width: 30, height: 5 },
  );
  const trigger = setup.renderer.root.findDescendantById("trigger");
  if (!(trigger instanceof CollapsibleTriggerRenderable)) {
    throw new Error("Expected Collapsible Trigger");
  }
  const retained = trigger;
  const mark = trigger.getChildren()[0];
  if (!(mark instanceof TextRenderable)) {
    throw new Error("Expected Collapsible mark");
  }

  await act(async () => theme.setActive("smoke"));
  await setup.waitFor(() => mark.fg.equals(parseColor("#123456")));

  expect(setup.renderer.root.findDescendantById("trigger")).toBe(retained);
  expect(text(trigger)).toEqual(["⌄", "Theme"]);
});
