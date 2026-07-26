import { afterEach, describe, expect, it } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createCollapsible,
  createCollapsibleContent,
  createCollapsibleTrigger,
} from "./components/ui/collapsible";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
  theme.setActive("terminal");
});

async function render() {
  setup = await createTestRenderer({ width: 30, height: 5 });
  const root = createCollapsible(setup.renderer);
  const trigger = createCollapsibleTrigger(setup.renderer, root, {
    label: "Details",
  });
  const content = createCollapsibleContent(setup.renderer, root);
  content.add(new TextRenderable(setup.renderer, { content: "Content" }));
  root.add(trigger);
  root.add(content);
  setup.renderer.root.add(root);
  await setup.renderOnce();
  return { content, root, trigger };
}

describe("installed Core Collapsible Recipe", () => {
  it("opens through packaged behavior and renders Recipe-owned content", async () => {
    const { content, root, trigger } = await render();
    expect(setup?.captureCharFrame()).toContain("› Details");
    expect(setup?.captureCharFrame()).not.toContain("Content");

    trigger.press();
    await setup?.renderOnce();

    expect(root.open).toBe(true);
    expect(content.visible).toBe(true);
    expect(setup?.captureCharFrame()).toContain("⌄ Details");
    expect(setup?.captureCharFrame()).toContain("Content");
  });

  it("restyles retained Recipe presentation from the Theme", async () => {
    theme.register("smoke", {
      tokens: { colors: { primary: "#123456" } },
    });
    const { content, trigger } = await render();
    const mark = trigger.getChildren()[0];
    if (!(mark instanceof TextRenderable)) {
      throw new Error("Expected Collapsible mark");
    }

    theme.setActive("smoke");
    await setup?.renderOnce();

    expect(mark.fg.equals(parseColor("#123456"))).toBe(true);
    expect(content.visible).toBe(false);
  });
});
