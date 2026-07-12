/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BaseRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  DialogCloseRenderable,
  type DialogRootRenderable,
  type DialogTriggerRenderable,
} from "@opentui-ui/dialog";
import { act, createRef } from "react";
import { Dialog } from "./components/ui/dialog";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Dialog recipe delegates controlled intent once and retains parts", async () => {
  const root = createRef<DialogRootRenderable>();
  let changes = 0;
  setup = await testRender(
    <box flexDirection="column">
      <Dialog
        ref={root}
        defaultOpen={false}
        title="Delete file?"
        trigger={<text content="Open" />}
      >
        <box>
          <text content="Body" />
        </box>
      </Dialog>
      <Dialog
        open={false}
        title="Controlled"
        trigger={<text content="Controlled open" />}
        onOpenChange={() => changes++}
      />
    </box>,
    { width: 60, height: 16 },
  );
  const recipeTrigger =
    root.current?.getChildren()[0] as DialogTriggerRenderable;
  await act(async () => recipeTrigger.press());
  expect(root.current?.state.open).toBe(true);
  const retainedRoot = root.current;
  const recipeClose = findClose(setup.renderer.root);
  await act(async () => recipeClose.press());
  expect(root.current?.state.open).toBe(false);
  await act(async () => recipeTrigger.press());
  expect(root.current?.state.open).toBe(true);
  expect(root.current).toBe(retainedRoot);
  const controlledRoot =
    root.current?.parent?.getChildren()[1] as DialogRootRenderable;
  const controlledTrigger =
    controlledRoot.getChildren()[0] as DialogTriggerRenderable;
  await act(async () => controlledTrigger.press());
  expect(changes).toBe(1);
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
