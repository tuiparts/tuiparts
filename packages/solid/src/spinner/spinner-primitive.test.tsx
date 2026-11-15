/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TextRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { SpinnerRootRenderable } from "@tuiparts/core/spinner";
import { ErrorBoundary } from "solid-js";
import { Spinner } from "./index";

let setup: TestRendererSetup | undefined;

function textContent(id: string): string {
  const text = setup?.renderer.root.findDescendantById(id) as TextRenderable;
  return text.content.chunks.map((chunk) => chunk.text).join("");
}

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Spinner", () => {
  it("renders compound parts and reflects state", async () => {
    let rootRef: SpinnerRootRenderable | undefined;

    setup = await testRender(
      () => (
        <Spinner.Root
          id="spinner-root"
          frames={["-", "\\", "|", "/"]}
          running={false}
          ref={(node) => {
            rootRef = node;
          }}
        >
          <Spinner.Indicator id="spinner-indicator" />
          <Spinner.Label id="spinner-label" content="Loading..." />
        </Spinner.Root>
      ),
      { width: 30, height: 5 },
    );

    expect(textContent("spinner-indicator")).toBe("-");
    expect(textContent("spinner-label")).toBe("Loading...");

    rootRef?.currentStore.nextFrame();
    await setup.waitFor(() => textContent("spinner-indicator") === "\\");
    expect(textContent("spinner-indicator")).toBe("\\");
  });

  it("throws if Indicator is used outside Spinner.Root", async () => {
    let error = "";
    setup = await testRender(
      () => (
        <ErrorBoundary
          fallback={(value: unknown) => {
            error = String(value);
            return null;
          }}
        >
          <Spinner.Indicator />
        </ErrorBoundary>
      ),
      { width: 10, height: 2 },
    );
    expect(error).toContain(
      "Spinner.Indicator must be rendered inside Spinner.Root",
    );
  });
});
