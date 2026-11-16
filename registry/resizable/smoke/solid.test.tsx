/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Resizable recipe", () => {
  it("renders panels and handle", async () => {
    setup = await testRender(
      () => (
        <ResizablePanelGroup id="group" direction="horizontal">
          <ResizablePanel id="panel-1" defaultSize={1}>
            <text content="Left panel" />
          </ResizablePanel>
          <ResizableHandle id="handle" withHandle={true} />
          <ResizablePanel id="panel-2" defaultSize={2}>
            <text content="Right panel" />
          </ResizablePanel>
        </ResizablePanelGroup>
      ),
      { width: 60, height: 20 },
    );
    await setup.renderOnce();

    const group = setup.renderer.root.findDescendantById(
      "group",
    ) as BoxRenderable;
    const handle = setup.renderer.root.findDescendantById(
      "handle",
    ) as BoxRenderable;

    expect(group).toBeDefined();
    expect(handle).toBeDefined();
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          border: "#654321",
          foreground: "#FEDCBA",
          mutedForeground: "#888888",
        },
      },
    });
    setup = await testRender(
      () => (
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>
            <text content="Top" />
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel>
            <text content="Bottom" />
          </ResizablePanel>
        </ResizablePanelGroup>
      ),
      { width: 60, height: 20 },
    );
    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
