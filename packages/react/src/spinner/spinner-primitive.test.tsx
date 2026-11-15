import { afterEach, describe, expect, it, spyOn } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { SpinnerRootRenderable } from "@tuiparts/core/spinner";
import { act, createElement } from "react";
import { Spinner } from "./index";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Spinner", () => {
  it("renders compound parts and reflects state", async () => {
    let rootRef: SpinnerRootRenderable | null = null;

    setup = await testRender(
      createElement(
        Spinner.Root,
        {
          id: "spinner-root",
          frames: ["-", "\\", "|", "/"],
          running: false,
          ref: (node) => {
            rootRef = node;
          },
        },
        createElement(Spinner.Indicator, { id: "spinner-indicator" }),
        createElement(Spinner.Label, {
          id: "spinner-label",
          content: "Loading...",
        }),
      ),
      { width: 30, height: 5 },
    );

    expect(textContent("spinner-indicator")).toBe("-");
    expect(textContent("spinner-label")).toBe("Loading...");

    await act(async () => {
      rootRef?.currentStore.nextFrame();
    });
    await setup.waitFor(() => textContent("spinner-indicator") === "\\");
    expect(textContent("spinner-indicator")).toBe("\\");
  });

  it("throws if Indicator is used outside Spinner.Root", async () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      setup = await testRender(createElement(Spinner.Indicator), {
        width: 20,
        height: 5,
      });
      expect(
        error.mock.calls.some((call) =>
          call.some((value) =>
            String(value).includes(
              "Spinner.Indicator must be rendered inside Spinner.Root",
            ),
          ),
        ),
      ).toBe(true);
    } finally {
      error.mockRestore();
    }
  });
});
