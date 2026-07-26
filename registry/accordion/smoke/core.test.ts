import { afterEach, describe, expect, it } from "bun:test";
import { parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createAccordion,
  createAccordionContent,
  createAccordionItem,
  createAccordionTrigger,
} from "./components/ui/accordion";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
  theme.setActive("terminal");
});

async function render() {
  setup = await createTestRenderer({ width: 30, height: 7 });
  const root = createAccordion(setup.renderer);
  const item = createAccordionItem(setup.renderer, root, { value: "details" });
  const trigger = createAccordionTrigger(setup.renderer, item, {
    label: "Details",
  });
  const content = createAccordionContent(setup.renderer, item);
  content.add(new TextRenderable(setup.renderer, { content: "Content" }));
  item.add(trigger);
  item.add(content);
  root.add(item);
  setup.renderer.root.add(root);
  await setup.renderOnce();
  return { content, item, root, trigger };
}

describe("installed Core Accordion Recipe", () => {
  it("opens through packaged behavior and renders Recipe content", async () => {
    const { content, root, trigger } = await render();
    expect(setup?.captureCharFrame()).toContain("› Details");
    expect(setup?.captureCharFrame()).not.toContain("Content");

    trigger.press();
    await setup?.renderOnce();

    expect(root.value).toEqual(["details"]);
    expect(content.visible).toBe(true);
    expect(setup?.captureCharFrame()).toContain("⌄ Details");
    expect(setup?.captureCharFrame()).toContain("Content");
  });

  it("restyles retained presentation from the Theme", async () => {
    theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
    const { content, trigger } = await render();
    const mark = trigger.getChildren()[0];
    if (!(mark instanceof TextRenderable)) {
      throw new Error("Expected Accordion mark");
    }

    theme.setActive("smoke");
    await setup?.renderOnce();

    expect(mark.fg.equals(parseColor("#123456"))).toBe(true);
    expect(content.visible).toBe(false);
  });
});
