import { afterEach, expect, test } from "bun:test";
import { parseColor } from "@opentui/core";
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
import { theme, tint } from "./components/ui/theme";

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

test("restyles from the theme store on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        surface: "#123456",
        background: "#654321",
        foreground: "#FEDCBA",
      },
    },
  });
  setup = await createTestRenderer({ width: 60, height: 16 });
  const dialog = createDialog(setup.renderer);
  setup.renderer.root.add(dialog.root);
  setup.renderer.root.add(dialog.portal);
  await setup.renderOnce();

  theme.setActive("smoke");
  expect(dialog.popup.backgroundColor.equals(parseColor("#123456"))).toBe(true);
  expect(dialog.trigger.backgroundColor.equals(parseColor("#123456"))).toBe(
    true,
  );
  expect(
    dialog.backdrop.backgroundColor.equals(tint("#654321", "#FEDCBA", 0.25)),
  ).toBe(true);
  expect(dialog.backdrop.backgroundColor.equals(parseColor("#654321"))).toBe(
    false,
  );

  theme.setActive("terminal");
  expect(dialog.popup.backgroundColor.equals(parseColor("#123456"))).toBe(
    false,
  );
});
