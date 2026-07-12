/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import type { BaseRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  DialogCloseRenderable,
  type DialogRootRenderable,
  type DialogTriggerRenderable,
} from "@opentui-ui/dialog";
import { createSignal } from "solid-js";
import { Dialog } from "./components/ui/dialog";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Solid Dialog recipe delegates controlled intent once and retains parts", async () => {
  let root: DialogRootRenderable | undefined;
  let controlledRoot: DialogRootRenderable | undefined;
  let controlledChanges = 0;
  setup = await testRender(
    () => {
      const [controlledOpen, setControlledOpen] = createSignal(false);
      return (
        <box flexDirection="column">
          <Dialog
            ref={(node) => (root = node)}
            defaultOpen={false}
            title="Delete file?"
            trigger={<text content="Open" />}
          >
            <box>
              <text content="Body" />
            </box>
          </Dialog>
          <Dialog
            ref={(node) => {
              controlledRoot = node;
            }}
            open={controlledOpen()}
            title="Controlled"
            trigger={<text content="Controlled open" />}
            onOpenChange={(open) => {
              controlledChanges++;
              setControlledOpen(open);
            }}
          />
        </box>
      );
    },
    { width: 60, height: 16 },
  );
  const trigger = root?.getChildren()[0] as DialogTriggerRenderable;
  const controlledTrigger =
    controlledRoot?.getChildren()[0] as DialogTriggerRenderable;
  trigger.press();
  expect(root?.state.open).toBe(true);
  const retainedRoot = root;
  findClose(setup.renderer.root).press();
  expect(root?.state.open).toBe(false);
  trigger.press();
  expect(root?.state.open).toBe(true);
  expect(root).toBe(retainedRoot);

  controlledTrigger.press();
  await setup.waitFor(() => controlledRoot?.state.open === true);
  expect(controlledChanges).toBe(1);
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
