import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { InputRenderable } from "./input";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function firstLine(width: number): string {
  return setup?.captureCharFrame().split("\n")[0]?.slice(0, width) ?? "";
}

describe("InputRenderable", () => {
  it("inherits editing, change, and submit behavior from OpenTUI", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: string[] = [];
    const submissions: string[] = [];
    const input = new InputRenderable(setup.renderer, {
      defaultValue: "A",
      onChange: (value) => changes.push(value),
      onSubmit: (value) => submissions.push(value),
      width: 12,
    });
    setup.renderer.root.add(input);
    input.focus();
    await setup.renderOnce();

    await setup.mockInput.typeText("BC");
    await setup.renderOnce();
    setup.mockInput.pressEnter();
    await setup.renderOnce();

    expect(input.value).toBe("ABC");
    expect(changes.at(-1)).toBe("ABC");
    expect(submissions).toEqual(["ABC"]);
    expect(firstLine(3)).toBe("ABC");
  });

  it("accepts external value updates and resolves focused styles", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const input = new InputRenderable(setup.renderer, {
      value: "Before",
      width: 12,
      styleResolver: ({ focused }) => ({
        root: {
          backgroundColor: "#112233",
          color: focused ? "#00FF00" : "#FF0000",
          cursorColor: "#FFFFFF",
          placeholderColor: "#777777",
          selectionBackgroundColor: "#334455",
          selectionColor: "#AABBCC",
        },
      }),
    });
    setup.renderer.root.add(input);
    await setup.renderOnce();

    input.value = "After";
    input.focus();
    await setup.renderOnce();

    expect(input.value).toBe("After");
    expect(input.getState().focused).toBe(true);
    expect(firstLine(5)).toBe("After");
    const content = setup
      .captureSpans()
      .lines[0]?.spans.find((span) => span.text.includes("After"));
    expect(content?.fg.toInts()).toEqual([0, 255, 0, 255]);
    expect(content?.bg.toInts()).toEqual([17, 34, 51, 255]);
    expect(input.selectionFg?.toInts()).toEqual([170, 187, 204, 255]);
    expect(input.selectionBg?.toInts()).toEqual([51, 68, 85, 255]);
  });

  it("blocks focus and editing while disabled", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const changes: string[] = [];
    const input = new InputRenderable(setup.renderer, {
      defaultValue: "Fixed",
      disabled: true,
      onChange: (value) => changes.push(value),
      width: 12,
    });
    setup.renderer.root.add(input);
    input.focus();
    await setup.renderOnce();
    await setup.mockInput.typeText("X");
    await setup.renderOnce();

    expect(input.focused).toBe(false);
    expect(input.value).toBe("Fixed");
    expect(changes).toEqual([]);
  });

  it("resolves styles on state transitions rather than every frame", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    let resolutions = 0;
    const input = new InputRenderable(setup.renderer, {
      width: 12,
      styleResolver: ({ focused }) => {
        resolutions++;
        return {
          root: { color: focused ? "#00FF00" : "#FFFFFF" },
        };
      },
    });
    setup.renderer.root.add(input);

    await setup.renderOnce();
    await setup.renderOnce();
    expect(resolutions).toBe(1);

    input.focus();
    await setup.renderOnce();
    await setup.renderOnce();
    expect(resolutions).toBe(2);
  });

  it("reasserts focused colors after a write to OpenTUI's setter-only channel", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const input = new InputRenderable(setup.renderer, {
      defaultValue: "Focus",
      width: 12,
      styleResolver: ({ focused }) => ({
        root: {
          color: focused ? "#00FF00" : "#FFFFFF",
          backgroundColor: focused ? "#112233" : "transparent",
        },
      }),
    });
    setup.renderer.root.add(input);
    input.focusedTextColor = "#FF0000";
    input.focusedBackgroundColor = "#FF0000";

    input.focus();
    await setup.renderOnce();

    const content = setup
      .captureSpans()
      .lines[0]?.spans.find((span) => span.text.includes("Focus"));
    expect(content?.fg.toInts()).toEqual([0, 255, 0, 255]);
    expect(content?.bg.toInts()).toEqual([17, 34, 51, 255]);
  });
});
