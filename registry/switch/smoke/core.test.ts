import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSwitch } from "./components/ui/switch";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function firstLine(): string {
  return setup?.captureCharFrame().split("\n")[0]?.trimEnd() ?? "";
}

describe("installed Core Switch recipe", () => {
  it("owns uncontrolled behavior and consumer-chosen presentation", async () => {
    const changes: boolean[] = [];
    setup = await createTestRenderer({ width: 30, height: 3 });
    const toggle = createSwitch(setup.renderer, {
      density: "comfortable",
      label: "Ready",
      symbols: "ascii",
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(toggle);
    await setup.renderOnce();

    expect(firstLine()).toBe("*----  Ready");
    toggle.press();
    await setup.renderOnce();

    expect(toggle.checked).toBe(true);
    expect(changes).toEqual([true]);
    expect(firstLine()).toBe("----*  Ready");
  });

  it("reports controlled intent and suppresses disabled interaction", async () => {
    const changes: boolean[] = [];
    setup = await createTestRenderer({ width: 30, height: 3 });
    const toggle = createSwitch(setup.renderer, {
      checked: false,
      disabled: true,
      label: "Disabled",
      onCheckedChange: (checked) => changes.push(checked),
    });
    setup.renderer.root.add(toggle);

    toggle.focus();
    toggle.press();
    expect(toggle.focused).toBe(false);
    expect(toggle.checked).toBe(false);
    expect(changes).toEqual([]);
  });
});
