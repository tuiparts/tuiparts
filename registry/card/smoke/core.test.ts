import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createCard,
  createCardContent,
  createCardDescription,
  createCardFooter,
  createCardHeader,
  createCardTitle,
} from "./components/ui/card";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Card recipe", () => {
  it("renders compound layout and accepts native overrides", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const card = createCard(setup.renderer, {
      backgroundColor: "#123456",
      borderColor: "#ABCDEF",
    });
    const header = createCardHeader(setup.renderer);
    const title = createCardTitle(setup.renderer, { content: "System Card" });
    const desc = createCardDescription(setup.renderer, {
      content: "Card description text",
    });
    header.add(title);
    header.add(desc);

    const content = createCardContent(setup.renderer);
    const footer = createCardFooter(setup.renderer);

    card.add(header);
    card.add(content);
    card.add(footer);

    setup.renderer.root.add(card);
    await setup.renderOnce();

    expect(card.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(card.borderColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(title.plainText).toBe("System Card");
    expect(desc.plainText).toBe("Card description text");
  });

  it("restyles from the theme store on theme switch", async () => {
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
    const card = createCard(setup.renderer);
    const title = createCardTitle(setup.renderer, { content: "Theme Card" });
    card.add(title);
    setup.renderer.root.add(card);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(card.backgroundColor.equals(parseColor("#123456"))).toBe(true);
    expect(card.borderColor.equals(parseColor("#654321"))).toBe(true);
    expect(title.fg.equals(parseColor("#FEDCBA"))).toBe(true);

    theme.setActive("terminal");
    expect(card.backgroundColor.equals(parseColor("#123456"))).toBe(false);
  });
});
