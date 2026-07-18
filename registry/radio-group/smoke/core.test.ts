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
import {
  createRadioGroup,
  createRadioGroupItem,
  type RadioGroupItemOptions,
  type RadioGroupOptions,
} from "./components/ui/radio-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

async function renderGroup(
  options: RadioGroupOptions,
  itemOptions: RadioGroupItemOptions[],
) {
  setup = await createTestRenderer({ width: 40, height: 6 });
  const renderer = setup.renderer;
  const root = createRadioGroup(renderer, options);
  const items = itemOptions.map((item) =>
    createRadioGroupItem(renderer, root.store, item),
  );
  for (const item of items) root.add(item);
  renderer.root.add(root);
  await setup.renderOnce();
  return { root, items };
}

function frameLines(): string[] {
  return (
    setup
      ?.captureCharFrame()
      .split("\n")
      .map((line) => line.trimEnd()) ?? []
  );
}

describe("installed Core RadioGroup recipe", () => {
  it("renders consumer-owned layout and mark while updating uncontrolled selection", async () => {
    const changes: string[] = [];
    const { root, items } = await renderGroup(
      {
        defaultValue: "alpha",
        orientation: "horizontal",
        gap: 2,
        onValueChange: (value) => changes.push(value),
      },
      [
        { value: "alpha", label: "Alpha", mark: "*" },
        { value: "beta", label: "Beta", mark: "*" },
      ],
    );
    const alpha = items[0];
    const beta = items[1];
    expect(alpha).toBeDefined();
    expect(beta).toBeDefined();

    expect(frameLines()[0]).toContain("* Alpha");
    expect(frameLines()[0]).toContain("Beta");
    beta?.press();
    await setup?.renderOnce();

    expect(root.value).toBe("beta");
    expect(alpha?.checked).toBe(false);
    expect(beta?.checked).toBe(true);
    expect(changes).toEqual(["beta"]);
    expect(frameLines()[0]).toContain("* Beta");
  });

  it("restyles from the theme store on theme switch", async () => {
    theme.register("smoke", {
      tokens: { colors: { primary: "#123456" }, glyphs: { radio: "*" } },
    });
    const { items } = await renderGroup({ defaultValue: "alpha" }, [
      { value: "alpha", label: "Alpha" },
    ]);
    expect(frameLines()[0]).toBe("● Alpha");

    theme.setActive("smoke");
    await setup?.renderOnce();
    expect(frameLines()[0]).toBe("* Alpha");
    const markCell = items[0]?.getChildren()[0] as BoxRenderable;
    const indicator = markCell.getChildren()[0] as BoxRenderable;
    const mark = indicator.getChildren()[0] as TextRenderable;
    expect(mark.fg.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
    await setup?.renderOnce();
    expect(frameLines()[0]).toBe("● Alpha");
  });
});
