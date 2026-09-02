import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { DialogManager } from "./manager";
import { DialogContainerRenderable } from "./renderables/dialog-container";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("DialogContainerRenderable", () => {
  it("dismisses the top dialog with Escape and restores focus", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const originalFocus = new BoxRenderable(setup.renderer, {
      id: "original-focus",
      focusable: true,
    });
    const manager = new DialogManager(setup.renderer);
    const container = new DialogContainerRenderable(setup.renderer, {
      manager,
    });
    setup.renderer.root.add(originalFocus);
    setup.renderer.root.add(container);
    originalFocus.focus();

    const id = manager.show({
      content: (ctx) => new BoxRenderable(ctx, { id: "dialog-content" }),
    });
    const dialog = container.getDialogRenderable(id);

    expect(dialog?.parent).toBe(container);
    expect(container.visible).toBe(true);
    await setup.mockInput.pressEscape();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(manager.getDialogs()).toEqual([]);
    expect(container.getDialogRenderables().size).toBe(0);
    expect(dialog?.isDestroyed).toBe(true);
    expect(container.visible).toBe(false);
    expect(setup.renderer.currentFocusedRenderable).toBe(originalFocus);
  });
});
