/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import { ASCIIBanner } from "./components/ui/ascii-banner";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid ASCIIBanner recipe", () => {
  it("renders banner with subtitle", async () => {
    setup = await testRender(
      () => (
        <ASCIIBanner
          text="TUI"
          font="tiny"
          subtitle="tuiparts.sh"
          width={60}
          height={10}
        />
      ),
      { width: 60, height: 10 },
    );
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("tuiparts.sh");
  });
});
