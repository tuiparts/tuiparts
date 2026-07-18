/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { type BaseRenderable, TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { SwitchRootRenderable } from "@tuiparts/core/switch";
import { Switch } from "./components/ui/switch";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function root(id: string): SwitchRootRenderable {
  return setup?.renderer.root.findDescendantById(id) as SwitchRootRenderable;
}

describe("installed Solid Switch recipe", () => {
  it("updates uncontrolled state and renders consumer-owned symbols", async () => {
    setup = await testRender(
      () => (
        <box flexDirection="column">
          <Switch id="uncontrolled" label="Uncontrolled" />
          <Switch
            id="custom"
            label="Custom"
            defaultChecked
            density="comfortable"
            symbols="ascii"
          />
        </box>
      ),
      { width: 40, height: 4 },
    );

    root("uncontrolled").press();
    await setup.waitFor(() => root("uncontrolled").checked);
    expect(root("uncontrolled").checked).toBe(true);

    expect(root("custom").checked).toBe(true);
  });

  it("restyles rendered switches on theme switch", async () => {
    function text(node: BaseRenderable): string[] {
      if (!node.visible) return [];
      return [
        ...(node instanceof TextRenderable ? [node.plainText] : []),
        ...node.getChildren().flatMap(text),
      ];
    }
    theme.register("smoke", {
      tokens: {
        colors: { primary: "#123456" },
        glyphs: { thumb: "@", track: "=" },
      },
    });
    setup = await testRender(() => <Switch id="themed" label="Theme" />, {
      width: 30,
      height: 3,
    });
    const themed = root("themed");
    expect(text(themed)).toEqual(["───", "●", "Theme"]);

    theme.setActive("smoke");
    await setup.waitFor(() => text(themed).join(" ") === "=== @ Theme");

    expect(setup.renderer.root.findDescendantById("themed")).toBe(themed);
    theme.setActive("terminal");
  });
});
