import { afterEach, describe, expect, it } from "bun:test";
import { BoxRenderable, parseColor, TextRenderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createScrollArea } from "./components/ui/scroll-area";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core ScrollArea recipe", () => {
  it("renders scrollbox with scrollable content", async () => {
    setup = await createTestRenderer({ width: 30, height: 6 });
    const scroll = createScrollArea(setup.renderer, {
      height: 6,
      width: 30,
    });
    const inner = new BoxRenderable(setup.renderer, {
      flexDirection: "column",
    });
    for (let i = 0; i < 10; i++) {
      inner.add(new TextRenderable(setup.renderer, { content: `Item ${i}` }));
    }
    scroll.add(inner);

    setup.renderer.root.add(scroll);
    await setup.renderOnce();

    const frame = setup.captureCharFrame();
    expect(frame.includes("Item 0")).toBe(true);
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 6 });
    const scroll = createScrollArea(setup.renderer, { height: 6, width: 30 });
    setup.renderer.root.add(scroll);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(scroll.borderColor.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
  });
});
