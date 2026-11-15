/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import {
  type BoxRenderable,
  parseColor,
  type TextRenderable,
} from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Card recipe", () => {
  it("renders compound layout and accepts native overrides", async () => {
    setup = await testRender(
      () => (
        <Card id="card" backgroundColor="#123456" borderColor="#ABCDEF">
          <CardHeader id="header">
            <CardTitle id="title" content="System Card" />
            <CardDescription id="desc" content="Card description text" />
          </CardHeader>
          <CardContent id="content">
            <text content="Body content" />
          </CardContent>
          <CardFooter id="footer">
            <text content="Footer content" />
          </CardFooter>
        </Card>
      ),
      { width: 40, height: 10 },
    );
    await setup.renderOnce();

    const card = setup.renderer.root.findDescendantById(
      "card",
    ) as BoxRenderable;
    const title = setup.renderer.root.findDescendantById(
      "title",
    ) as TextRenderable;
    const desc = setup.renderer.root.findDescendantById(
      "desc",
    ) as TextRenderable;

    expect(card).toBeDefined();
    expect(card.backgroundColor.toInts()).toEqual([18, 52, 86, 255]);
    expect(card.borderColor.toInts()).toEqual([171, 205, 239, 255]);
    expect(title.plainText).toBe("System Card");
    expect(desc.plainText).toBe("Card description text");
  });

  it("restyles the rendered Card on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          border: "#654321",
          foreground: "#FEDCBA",
        },
      },
    });
    setup = await testRender(
      () => (
        <Card id="themed">
          <CardTitle id="themed-title" content="Theme Card" />
        </Card>
      ),
      { width: 30, height: 5 },
    );
    const card = setup.renderer.root.findDescendantById(
      "themed",
    ) as BoxRenderable;
    const title = setup.renderer.root.findDescendantById(
      "themed-title",
    ) as TextRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() =>
      card.backgroundColor.equals(parseColor("#123456")),
    );

    expect(card.borderColor.equals(parseColor("#654321"))).toBe(true);
    expect(title.fg.equals(parseColor("#FEDCBA"))).toBe(true);
    theme.setActive("terminal");
  });
});
