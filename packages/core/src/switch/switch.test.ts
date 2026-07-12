import { afterEach, describe, expect, it } from "bun:test";
import { type KeyEvent, Renderable } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { SwitchRenderable } from "./switch";

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

function spanBackground(text: string): number[] | undefined {
  return setup
    ?.captureSpans()
    .lines.flatMap((line) => line.spans)
    .find((span) => span.text.includes(text))
    ?.bg.toInts();
}

describe("SwitchRenderable", () => {
  it("composes fixed track, moving thumb, and optional label", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const unlabeled = new SwitchRenderable(setup.renderer, {
      alignSelf: "flex-start",
    });
    setup.renderer.root.add(unlabeled);
    await setup.renderOnce();

    expect(unlabeled.width).toBe(4);
    expect(firstLine(4)).toBe("●───");

    unlabeled.label = "Go";
    unlabeled.toggle();
    await setup.renderOnce();

    expect(unlabeled.width).toBe(7);
    expect(firstLine(7)).toBe("───● Go");

    const labelChild = unlabeled.getChildren()[1];
    expect(labelChild).toBeDefined();
    unlabeled.label = "";
    await setup.renderOnce();
    expect(unlabeled.width).toBe(4);
    expect(unlabeled.getChildrenCount()).toBe(1);
    expect(Renderable.renderablesByNumber.has(labelChild?.num ?? -1)).toBe(
      false,
    );

    const track = unlabeled.getChildren()[0];
    const owned = [track, ...(track?.getChildren() ?? [])];
    unlabeled.destroy();
    expect(
      owned.every(
        (child) => !Renderable.renderablesByNumber.has(child?.num ?? -1),
      ),
    ).toBe(true);
  });

  it("updates uncontrolled state, callback values, and slot styles", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const toggle = new SwitchRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Ship",
      onCheckedChange: (checked) => changes.push(checked),
      styleResolver: ({ checked }) => ({
        track: {
          backgroundColor: "#112233",
          color: "#FF0000",
          size: 5,
          gap: 2,
        },
        thumb: { color: checked ? "#00FF00" : "#FFFFFF" },
        label: { color: "#AABBCC" },
      }),
    });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();

    expect(toggle.width).toBe(11);
    expect(firstLine(11)).toBe("●────  Ship");

    toggle.gap = 5;
    await setup.renderOnce();
    expect(toggle.width).toBe(14);

    await setup.mockMouse.click(0, 0);
    await setup.renderOnce();

    expect(toggle.checked).toBe(true);
    expect(toggle.width).toBe(11);
    expect(changes).toEqual([true]);
    expect(firstLine(11)).toBe("────●  Ship");
    expect(spanColor("────")).toEqual([255, 0, 0, 255]);
    expect(spanBackground("────")).toEqual([17, 34, 51, 255]);
    expect(spanColor("●")).toEqual([0, 255, 0, 255]);
    expect(spanColor("Ship")).toEqual([170, 187, 204, 255]);
  });

  it("keeps controlled state external and suppresses disabled activation", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: boolean[] = [];
    const toggle = new SwitchRenderable(setup.renderer, {
      alignSelf: "flex-start",
      checked: false,
      label: "Ship",
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();

    toggle.toggle();
    expect(toggle.checked).toBe(false);
    expect(changes).toEqual([true]);

    toggle.checked = true;
    await setup.renderOnce();
    expect(firstLine(9)).toBe("───● Ship");

    toggle.disabled = true;
    toggle.toggle();
    expect(toggle.handleKeyPress({ name: "space" } as KeyEvent)).toBe(false);
    await setup.mockMouse.click(0, 0);
    expect(changes).toEqual([true]);
  });
});
