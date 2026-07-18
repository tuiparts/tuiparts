/** @jsxImportSource @opentui/solid */

import { afterEach, expect, test } from "bun:test";
import {
  type BaseRenderable,
  type BoxRenderable,
  parseColor,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  DialogCloseRenderable,
  type DialogRootRenderable,
  type DialogTriggerRenderable,
} from "@tuiparts/core/dialog";
import { createSignal } from "solid-js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { theme } from "./components/ui/theme";

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
          <Dialog ref={(node) => (root = node)} defaultOpen={false}>
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
          </Dialog>
          <Dialog
            ref={(node) => {
              controlledRoot = node;
            }}
            open={controlledOpen()}
            onOpenChange={(open) => {
              controlledChanges++;
              setControlledOpen(open);
            }}
          >
            <DialogTrigger>
              <text content="Controlled open" />
            </DialogTrigger>
            <DialogContent>
              <DialogTitle content="Controlled" />
            </DialogContent>
          </Dialog>
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

test("restyles rendered dialog parts on theme switch", async () => {
  theme.register("smoke", { tokens: { colors: { surface: "#123456" } } });
  setup = await testRender(
    () => (
      <Dialog defaultOpen>
        <DialogTrigger>
          <text content="Open" />
        </DialogTrigger>
        <DialogContent id="themed-popup">
          <DialogTitle content="Theme" />
        </DialogContent>
      </Dialog>
    ),
    { width: 60, height: 16 },
  );
  const popup = setup.renderer.root.findDescendantById(
    "themed-popup",
  ) as BoxRenderable;

  theme.setActive("smoke");
  await setup.waitFor(() =>
    popup.backgroundColor.equals(parseColor("#123456")),
  );

  expect(setup.renderer.root.findDescendantById("themed-popup")).toBe(popup);
  theme.setActive("terminal");
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
