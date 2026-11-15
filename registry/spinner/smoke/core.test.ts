import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSpinner } from "./components/ui/spinner";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Spinner recipe", () => {
  it("renders with indicator and label", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const spinner = createSpinner(setup.renderer, {
      label: "Loading...",
      running: false,
    });
    setup.renderer.root.add(spinner);
    await setup.renderOnce();

    expect(spinner.indicator.currentFrame).toBe("⠋");
    expect(spinner.labelNode?.plainText).toBe("Loading...");

    spinner.currentStore.nextFrame();
    expect(spinner.indicator.currentFrame).toBe("⠙");
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const spinner = createSpinner(setup.renderer, {
      intent: "primary",
      running: false,
    });
    setup.renderer.root.add(spinner);

    theme.setActive("smoke");
    expect(spinner.indicator.fg).toBeDefined();
    theme.setActive("terminal");
  });
});
