import { afterEach, expect, test } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  addDialogClose,
  addDialogDescription,
  addDialogTitle,
  createDialog,
} from "./components/ui/dialog";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

test("installed Core Dialog recipe composes and delegates trigger, close, and backdrop", async () => {
  setup = await createTestRenderer({ width: 60, height: 16 });
  const dialog = createDialog(setup.renderer);
  addDialogTitle(setup.renderer, dialog, "Delete file?");
  addDialogDescription(setup.renderer, dialog, "This cannot be undone.");
  const close = addDialogClose(setup.renderer, dialog);
  setup.renderer.root.add(dialog.root);
  setup.renderer.root.add(dialog.portal);

  expect(dialog.popup.getChildren()).toHaveLength(3);
  dialog.trigger.press();
  expect(dialog.root.state.open).toBe(true);
  expect(dialog.portal.visible).toBe(true);
  close.press();
  expect(dialog.root.state.open).toBe(false);
  dialog.trigger.press();
  expect(dialog.popup.visible).toBe(true);
  dialog.backdrop.processMouseEvent({ type: "up" } as never);
  expect(dialog.root.state.open).toBe(false);
});
