/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act, createElement } from "react";
import { DialogProvider } from "./react";
import type { DialogContainerRenderable } from "./renderables/dialog-container";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React DialogProvider", () => {
  it("destroys and detaches its container during renderer teardown", async () => {
    setup = await testRender(
      createElement(
        DialogProvider,
        null,
        createElement("text", { content: "Application" }),
      ),
      { width: 40, height: 10 },
    );
    const container = setup.renderer.root.findDescendantById(
      "dialog-container",
    ) as DialogContainerRenderable;

    expect(container.parent).toBe(setup.renderer.root);
    await act(async () => setup?.renderer.destroy());
    setup = undefined;

    expect(container.isDestroyed).toBe(true);
    expect(container.parent).toBeNull();
  });
});
