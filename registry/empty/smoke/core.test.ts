import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createEmpty,
  createEmptyDescription,
  createEmptyHeader,
  createEmptyTitle,
} from "./components/ui/empty";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Empty recipe", () => {
  it("renders empty state callout", async () => {
    setup = await createTestRenderer({ width: 40, height: 8 });
    const empty = createEmpty(setup.renderer);
    const header = createEmptyHeader(setup.renderer);
    const title = createEmptyTitle(setup.renderer, {
      content: "No Items Found",
    });
    const desc = createEmptyDescription(setup.renderer, {
      content: "Create an item to get started.",
    });
    header.add(title);
    header.add(desc);
    empty.add(header);

    setup.renderer.root.add(empty);
    await setup.renderOnce();

    expect(title.textNode?.plainText).toBe("No Items Found");
    expect(desc.textNode?.plainText).toBe("Create an item to get started.");

    const frame = setup.captureCharFrame();
    expect(frame.includes("No Items Found")).toBe(true);
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          foreground: "#654321",
          mutedForeground: "#888888",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 6 });
    const empty = createEmpty(setup.renderer);
    const title = createEmptyTitle(setup.renderer, { content: "Theme" });
    empty.add(title);
    setup.renderer.root.add(empty);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(empty.borderColor.equals(parseColor("#123456"))).toBe(true);
    expect(title.textNode?.fg.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
  });
});
