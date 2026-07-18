/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import {
  type BaseRenderable,
  type BoxRenderable,
  parseColor,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  DialogCloseRenderable,
  type DialogRootRenderable,
  type DialogTriggerRenderable,
} from "@tuiparts/core/dialog";
import { act, createRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Dialog recipe composes parts and delegates trigger and close", async () => {
  const root = createRef<DialogRootRenderable>();
  setup = await testRender(
    <Dialog ref={root} defaultOpen={false}>
      <DialogTrigger>
        <text content="Open" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle content="Delete file?" />
        <text content="Body" />
        <DialogClose>
          <text content="Close" />
        </DialogClose>
      </DialogContent>
    </Dialog>,
    { width: 60, height: 16 },
  );
  const recipeTrigger =
    root.current?.getChildren()[0] as DialogTriggerRenderable;
  await act(async () => recipeTrigger.press());
  expect(root.current?.state.open).toBe(true);
  const recipeClose = findClose(setup.renderer.root);
  await act(async () => recipeClose.press());
  expect(root.current?.state.open).toBe(false);
});

test("restyles rendered dialog parts on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { surface: "#123456" } } });
  setup = await testRender(
    <Dialog defaultOpen>
      <DialogTrigger>
        <text content="Open" />
      </DialogTrigger>
      <DialogContent id="themed-popup">
        <DialogTitle content="Theme" />
      </DialogContent>
    </Dialog>,
    { width: 60, height: 16 },
  );
  const popup = setup.renderer.root.findDescendantById(
    "themed-popup",
  ) as BoxRenderable;

  await act(async () => {
    theme.setActive("smoke");
  });
  await setup.waitFor(() =>
    popup.backgroundColor.equals(parseColor("#123456")),
  );

  expect(setup.renderer.root.findDescendantById("themed-popup")).toBe(popup);
  await act(async () => {
    theme.setActive("terminal");
  });
});

function findClose(node: BaseRenderable): DialogCloseRenderable {
  if (node instanceof DialogCloseRenderable) return node;
  for (const child of node.getChildren()) {
    const found = findCloseOrUndefined(child);
    if (found) return found;
  }
  throw new Error("Dialog recipe Close was not rendered");
}

function findCloseOrUndefined(
  node: BaseRenderable,
): DialogCloseRenderable | undefined {
  if (node instanceof DialogCloseRenderable) return node;
  for (const child of node.getChildren()) {
    const found = findCloseOrUndefined(child);
    if (found) return found;
  }
  return undefined;
}
