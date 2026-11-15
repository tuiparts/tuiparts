/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "./components/ui/empty";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Empty recipe runtime smoke", () => {
  it("renders empty state callout", async () => {
    setup = await testRender(
      <Empty id="empty-state">
        <EmptyHeader>
          <EmptyTitle content="No Items Found" />
          <EmptyDescription content="Create an item to get started." />
        </EmptyHeader>
      </Empty>,
      { width: 40, height: 8 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("No Items Found")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { border: "#123456" } } });
    setup = await testRender(
      <Empty id="themed-empty">
        <EmptyTitle content="Themed" />
      </Empty>,
      { width: 30, height: 6 },
    );
    await act(async () => {
      theme.setActive("smoke");
    });
    await setup.renderOnce();
    await act(async () => {
      theme.setActive("terminal");
    });
  });
});
