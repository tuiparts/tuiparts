/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { DialogContainerRenderable } from "./renderables/dialog-container";
import { DialogProvider } from "./solid";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid DialogProvider", () => {
  it("destroys and detaches its container during renderer teardown", async () => {
    setup = await testRender(
      () => (
        <DialogProvider>
          <text content="Application" />
        </DialogProvider>
      ),
      { width: 40, height: 10 },
    );
    const container = setup.renderer.root.findDescendantById(
      "dialog-container",
    ) as DialogContainerRenderable;

    expect(container.parent).toBe(setup.renderer.root);
    setup.renderer.destroy();
    setup = undefined;

    expect(container.isDestroyed).toBe(true);
    expect(container.parent).toBeNull();
  });
});
