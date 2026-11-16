import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSeparator } from "./components/ui/separator";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Separator recipe", () => {
  it("renders horizontal line by default", async () => {
    setup = await createTestRenderer({ width: 10, height: 2 });
    const sep = createSeparator(setup.renderer, {
      borderColor: "#ABCDEF",
      width: 10,
    });
    setup.renderer.root.add(sep);
    await setup.renderOnce();

    expect(sep.borderColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(sep.border).toEqual(["top"]);
    expect(setup.captureCharFrame().split("\n")[0]).toBe("──────────");
  });

  it("renders vertical line", async () => {
    setup = await createTestRenderer({ width: 3, height: 3 });
    const sep = createSeparator(setup.renderer, {
      borderColor: "#ABCDEF",
      height: 3,
      orientation: "vertical",
    });
    setup.renderer.root.add(sep);
    await setup.renderOnce();

    expect(sep.border).toEqual(["left"]);
    expect(setup.captureCharFrame()).toBe("│  \n│  \n│  \n");
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
        },
      },
    });
    setup = await createTestRenderer({ width: 5, height: 1 });
    const sep = createSeparator(setup.renderer, { width: 5 });
    setup.renderer.root.add(sep);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(sep.borderColor.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    expect(sep.borderColor.equals(parseColor("#123456"))).toBe(false);
  });
});
