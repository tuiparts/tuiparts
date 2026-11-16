import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createHoverCard } from "./components/ui/hover-card";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core HoverCard recipe", () => {
  it("renders trigger and content containers", async () => {
    setup = await createTestRenderer({ width: 30, height: 6 });
    const hoverCard = createHoverCard(setup.renderer, {
      open: true,
    });
    setup.renderer.root.add(hoverCard);
    await setup.renderOnce();

    expect(hoverCard.open).toBe(true);
    expect(hoverCard.contentBox.visible).toBe(true);
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          border: "#654321",
          foreground: "#FEDCBA",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 6 });
    const hoverCard = createHoverCard(setup.renderer, {
      open: true,
    });
    setup.renderer.root.add(hoverCard);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
