import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createASCIIBanner } from "./components/ui/ascii-banner";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core ASCIIBanner recipe", () => {
  it("renders ascii banner and subtitle", async () => {
    setup = await createTestRenderer({ width: 60, height: 10 });
    const banner = createASCIIBanner(setup.renderer, {
      text: "TUI",
      font: "tiny",
      subtitle: "tuiparts.sh",
    });
    setup.renderer.root.add(banner);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("tuiparts.sh");
  });
});
