import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { RadioRenderable } from "./radio";
import { RadioGroupRenderable } from "./radio-group";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("RadioGroupRenderable", () => {
  it("lays out real Radio children and preserves application-owned state", async () => {
    setup = await createTestRenderer({ width: 30, height: 8 });
    const group = new RadioGroupRenderable(setup.renderer, {
      alignSelf: "flex-start",
      flexDirection: "column",
      gap: 1,
    });
    const alpha = new RadioRenderable(setup.renderer, {
      label: "Alpha",
      selected: true,
    });
    const beta = new RadioRenderable(setup.renderer, {
      label: "Beta",
      onActivate: () => {
        alpha.selected = false;
        beta.selected = true;
      },
    });
    group.add(alpha);
    group.add(beta);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(group.width).toBe(7);
    expect(group.height).toBe(3);
    expect(setup.captureCharFrame().split("\n").slice(0, 3)).toEqual([
      "● Alpha                       ",
      "                              ",
      "○ Beta                        ",
    ]);

    beta.activate();
    await setup.renderOnce();
    expect(setup.captureCharFrame().split("\n").slice(0, 3)).toEqual([
      "○ Alpha                       ",
      "                              ",
      "● Beta                        ",
    ]);
  });

  it("applies runtime layout and background styles to its native root", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const group = new RadioGroupRenderable(setup.renderer, {
      alignSelf: "flex-start",
    });
    group.add(new RadioRenderable(setup.renderer, { label: "A" }));
    group.add(new RadioRenderable(setup.renderer, { label: "B" }));
    setup.renderer.root.add(group);

    group.styles = {
      root: {
        backgroundColor: "#112233",
        flexDirection: "row",
        gap: 2,
        paddingX: 1,
      },
    };
    await setup.renderOnce();

    expect(group.width).toBe(10);
    expect(group.height).toBe(1);
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      " ○ A  ○ B ",
    );
    const content = setup
      .captureSpans()
      .lines[0]?.spans.find((span) => span.text.includes("○"));
    expect(content?.bg.toInts()).toEqual([17, 34, 51, 255]);
  });
});
