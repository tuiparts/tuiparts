import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createCheckbox } from "./components/ui/checkbox";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

async function render(options: Parameters<typeof createCheckbox>[1]) {
  setup = await createTestRenderer({ width: 30, height: 3 });
  const checkbox = createCheckbox(setup.renderer, options);
  setup.renderer.root.add(checkbox);
  await setup.renderOnce();
  return checkbox;
}

function firstLine(): string {
  return setup?.captureCharFrame().split("\n")[0]?.trimEnd() ?? "";
}

describe("installed Core Checkbox recipe", () => {
  it("updates uncontrolled state", async () => {
    const changes: boolean[] = [];
    const checkbox = await render({
      label: "Ready",
      mark: "x",
      onCheckedChange: (checked) => changes.push(checked),
    });

    expect(firstLine()).toBe("  Ready");
    checkbox.press();
    await setup?.renderOnce();

    expect(checkbox.checked).toBe(true);
    expect(changes).toEqual([true]);
    expect(firstLine()).toBe("x Ready");
  });

  it("reports controlled intent without owning the update", async () => {
    const changes: boolean[] = [];
    const checkbox = await render({
      checked: false,
      label: "Controlled",
      mark: "x",
      onCheckedChange: (checked) => changes.push(checked),
    });

    checkbox.press();
    expect(changes).toEqual([true]);
    expect(checkbox.checked).toBe(false);

    checkbox.checked = true;
    await setup?.renderOnce();
    expect(firstLine()).toBe("x Controlled");
  });

  it("suppresses disabled interaction", async () => {
    const changes: boolean[] = [];
    const checkbox = await render({
      disabled: true,
      label: "Disabled",
      onCheckedChange: (checked) => changes.push(checked),
    });

    checkbox.focus();
    checkbox.press();

    expect(checkbox.focused).toBe(false);
    expect(checkbox.checked).toBe(false);
    expect(changes).toEqual([]);
  });

  it("renders a consumer-owned mark", async () => {
    await render({ defaultChecked: true, label: "Custom", mark: "*" });
    expect(firstLine()).toBe("* Custom");
  });
});
