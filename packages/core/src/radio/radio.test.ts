import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { RadioRenderable } from "./radio";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function firstLine(width: number): string {
  return setup?.captureCharFrame().split("\n")[0]?.slice(0, width) ?? "";
}

function spanColor(text: string): number[] | undefined {
  return setup
    ?.captureSpans()
    .lines.flatMap((line) => line.spans)
    .find((span) => span.text.includes(text))
    ?.fg.toInts();
}

describe("RadioRenderable", () => {
  it("composes mark and label with Yoga-managed dimensions", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const radio = new RadioRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Alpha",
    });

    setup.renderer.root.add(radio);
    await setup.renderOnce();

    expect(radio.width).toBe(7);
    expect(firstLine(7)).toBe("○ Alpha");

    radio.symbols = { selected: "(*)", unselected: "( )" };
    radio.label = "A";
    await setup.renderOnce();

    expect(radio.width).toBe(5);
    expect(firstLine(5)).toBe("( ) A");
  });

  it("keeps selection external while updating selected slot styles", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    let activations = 0;
    const radio = new RadioRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Alpha",
      onActivate: () => activations++,
      styleResolver: ({ selected }) => ({
        box: {},
        mark: { color: selected ? "#00FF00" : "#FF0000" },
        label: { color: "#FFFFFF" },
      }),
    });

    setup.renderer.root.add(radio);
    await setup.renderOnce();

    await setup.mockMouse.click(0, 0);
    expect(activations).toBe(1);
    expect(radio.selected).toBe(false);
    expect(firstLine(7)).toBe("○ Alpha");

    radio.selected = true;
    await setup.renderOnce();
    expect(firstLine(7)).toBe("● Alpha");
    expect(spanColor("●")).toEqual([0, 255, 0, 255]);
  });

  it("suppresses disabled activation", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    let activations = 0;
    const radio = new RadioRenderable(setup.renderer, {
      alignSelf: "flex-start",
      disabled: true,
      label: "Alpha",
      onActivate: () => activations++,
    });

    setup.renderer.root.add(radio);
    await setup.renderOnce();

    radio.activate();
    expect(radio.handleKeyPress({ name: "enter" } as KeyEvent)).toBe(false);
    await setup.mockMouse.click(0, 0);
    expect(activations).toBe(0);
  });
});
