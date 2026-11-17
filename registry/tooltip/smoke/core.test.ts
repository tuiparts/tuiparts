import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { theme } from "./components/ui/theme";
import { createTooltip } from "./components/ui/tooltip";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Tooltip recipe", () => {
  it("renders tooltip content and accepts overrides", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const tooltip = createTooltip(setup.renderer, {
      content: "Helpful hint",
    });
    setup.renderer.root.add(tooltip);
    await setup.renderOnce();

    expect(tooltip.content).toBe("Helpful hint");
    expect(tooltip.open).toBe(true);
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
    setup = await createTestRenderer({ width: 30, height: 5 });
    const tooltip = createTooltip(setup.renderer, {
      content: "Theme tooltip",
    });
    setup.renderer.root.add(tooltip);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
