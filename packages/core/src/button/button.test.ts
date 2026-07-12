import { afterEach, describe, expect, it } from "bun:test";
import type { KeyEvent } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { ButtonRenderable } from "./button";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function contentColors(text: string) {
  const span = setup
    ?.captureSpans()
    .lines.flatMap((line) => line.spans)
    .find((candidate) => candidate.text.includes(text));
  return {
    fg: span?.fg.toInts(),
    bg: span?.bg.toInts(),
  };
}

describe("ButtonRenderable", () => {
  it("uses composed label content and padding for Yoga measurement", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const button = new ButtonRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Go",
    });

    setup.renderer.root.add(button);
    await setup.renderOnce();

    expect(button.width).toBe(6);
    expect(button.height).toBe(1);
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 6)).toBe("  Go  ");

    button.label = "Launch";
    await setup.renderOnce();

    expect(button.width).toBe(10);
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 10)).toBe(
      "  Launch  ",
    );
  });

  it("reapplies pressed and focused styles around mouse activation", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    let presses = 0;
    const button = new ButtonRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "Go",
      onPress: () => presses++,
      styleResolver: ({ focused, pressed }) => ({
        root: {
          backgroundColor: pressed
            ? "#AA0000"
            : focused
              ? "#0000AA"
              : "#111111",
          opacity: pressed ? 0.5 : undefined,
        },
        label: { color: "#00FF00" },
      }),
    });

    setup.renderer.root.add(button);
    await setup.renderOnce();
    expect(button.width).toBe(6);

    await setup.mockMouse.pressDown(1, 0);
    await setup.renderOnce();
    expect(button.getState().pressed).toBe(true);
    expect(button.opacity).toBe(0.5);
    expect(contentColors("Go").bg).toEqual([85, 0, 0, 255]);

    await setup.mockMouse.release(1, 0);
    await setup.renderOnce();
    expect(button.getState()).toEqual({
      focused: true,
      disabled: false,
      pressed: false,
    });
    expect(contentColors("Go").fg).toEqual([0, 255, 0, 255]);
    expect(contentColors("Go").bg).toEqual([0, 0, 170, 255]);
    expect(button.opacity).toBe(1);
    expect(presses).toBe(1);
  });

  it("suppresses programmatic, keyboard, and mouse activation when disabled", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    let presses = 0;
    const button = new ButtonRenderable(setup.renderer, {
      alignSelf: "flex-start",
      disabled: true,
      label: "No",
      onPress: () => presses++,
    });

    setup.renderer.root.add(button);
    await setup.renderOnce();

    button.press();
    expect(button.handleKeyPress({ name: "enter" } as KeyEvent)).toBe(false);
    await setup.mockMouse.click(1, 0);

    expect(presses).toBe(0);
    expect(button.getState().pressed).toBe(false);
  });
});
