/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import { type BaseRenderable, parseColor, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  AccordionPanelRenderable,
  AccordionTriggerRenderable,
} from "@tuiparts/core/accordion";
import { act } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
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

test("installed React Accordion Recipe runtime smoke", async () => {
  setup = await testRender(
    <Accordion id="root">
      <AccordionItem value="details">
        <AccordionTrigger id="trigger" label="Details" />
        <AccordionContent id="content">
          <text content="Content" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>,
    { width: 30, height: 7 },
  );
  const trigger = setup.renderer.root.findDescendantById("trigger");
  if (!(trigger instanceof AccordionTriggerRenderable)) {
    throw new Error("Expected Accordion Trigger");
  }
  expect(text(trigger)).toEqual(["›", "Details"]);
  expect(setup.renderer.root.findDescendantById("content")).toBeUndefined();

  await act(async () => trigger.press());
  await setup.waitFor(() =>
    Boolean(setup?.renderer.root.findDescendantById("content")),
  );

  expect(text(trigger)).toEqual(["⌄", "Details"]);
  expect(setup.renderer.root.findDescendantById("content")).toBeInstanceOf(
    AccordionPanelRenderable,
  );
});

test("restyles a retained React Accordion on Theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
  setup = await testRender(
    <Accordion>
      <AccordionItem value="theme">
        <AccordionTrigger id="trigger" label="Theme" />
        <AccordionContent keepMounted />
      </AccordionItem>
    </Accordion>,
    { width: 30, height: 7 },
  );
  const trigger = setup.renderer.root.findDescendantById("trigger");
  if (!(trigger instanceof AccordionTriggerRenderable)) {
    throw new Error("Expected Accordion Trigger");
  }
  const mark = trigger.getChildren()[0];
  if (!(mark instanceof TextRenderable)) {
    throw new Error("Expected Accordion mark");
  }

  await act(async () => theme.setActive("smoke"));
  await setup.waitFor(() => mark.fg.equals(parseColor("#123456")));

  expect(text(trigger)).toEqual(["›", "Theme"]);
});
