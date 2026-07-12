import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { CheckboxRenderable } from "./checkbox";

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

describe("CheckboxRenderable", () => {
  it("composes mark and label with Yoga-managed gap and dimensions", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const checkbox = new CheckboxRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Ready",
    });

    setup.renderer.root.add(checkbox);
    await setup.renderOnce();

    expect(checkbox.width).toBe(7);
    expect(checkbox.height).toBe(1);
    expect(firstLine(7)).toBe("○ Ready");

    checkbox.symbols = { checked: "[x]", unchecked: "[ ]" };
    checkbox.label = "Ship";
    await setup.renderOnce();

    expect(checkbox.width).toBe(8);
    expect(firstLine(8)).toBe("[ ] Ship");
  });

  it("updates uncontrolled state, callback values, and state styles", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const checkbox = new CheckboxRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Ready",
      onCheckedChange: (checked) => changes.push(checked),
      styleResolver: ({ checked }) => ({
        box: { flexDirection: "row", gap: 2 },
        mark: { color: checked ? "#00FF00" : "#FF0000" },
        label: { color: "#FFFFFF" },
      }),
    });

    setup.renderer.root.add(checkbox);
    await setup.renderOnce();
    expect(firstLine(8)).toBe("○  Ready");
    expect(spanColor("○")).toEqual([255, 0, 0, 255]);

    await setup.mockMouse.click(0, 0);
    await setup.renderOnce();

    expect(checkbox.checked).toBe(true);
    expect(changes).toEqual([true]);
    expect(firstLine(8)).toBe("◉  Ready");
    expect(spanColor("◉")).toEqual([0, 255, 0, 255]);
  });

  it("keeps controlled state external and suppresses disabled activation", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const checkbox = new CheckboxRenderable(setup.renderer, {
      alignSelf: "flex-start",
      checked: false,
      label: "Ready",
      onCheckedChange: (checked) => changes.push(checked),
    });

    setup.renderer.root.add(checkbox);
    await setup.renderOnce();

    checkbox.toggle();
    expect(checkbox.checked).toBe(false);
    expect(changes).toEqual([true]);

    checkbox.checked = true;
    await setup.renderOnce();
    expect(firstLine(7)).toBe("◉ Ready");

    checkbox.disabled = true;
    checkbox.toggle();
    expect(checkbox.handleKeyPress({ name: "space" } as KeyEvent)).toBe(false);
    await setup.mockMouse.click(0, 0);
    expect(changes).toEqual([true]);
  });
});
