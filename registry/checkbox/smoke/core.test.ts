import { afterEach, describe, expect, it } from "bun:test";
import {
  type BoxRenderable,
  parseColor,
  type TextRenderable,
} from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createCheckbox } from "./components/ui/checkbox";
import { theme } from "./components/ui/theme";

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

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: { colors: { primary: "#123456" }, glyphs: { check: "x" } },
    });
    const checkbox = await render({ defaultChecked: true, label: "Theme" });
    expect(firstLine()).toBe("✓ Theme");

    theme.setActive("smoke");
    await setup?.renderOnce();
    expect(firstLine()).toBe("x Theme");
    const markCell = checkbox.getChildren()[0] as BoxRenderable;
    const indicator = markCell.getChildren()[0] as BoxRenderable;
    const mark = indicator.getChildren()[0] as TextRenderable;
    expect(mark.fg.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    await setup?.renderOnce();
    expect(firstLine()).toBe("✓ Theme");
  });
});
