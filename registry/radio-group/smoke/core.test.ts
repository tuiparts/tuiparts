import { afterEach, describe, expect, it } from "bun:test";
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
  it("renders consumer-owned horizontal layout and mark while updating uncontrolled selection", async () => {
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
    expect(alpha?.selected).toBe(false);
    expect(beta?.selected).toBe(true);
    expect(changes).toEqual(["beta"]);
    expect(frameLines()[0]).toContain("* Beta");
  });

  it("reports controlled intent without owning the update", async () => {
    const changes: string[] = [];
    const { root, items } = await renderGroup(
      {
        value: "alpha",
        onValueChange: (value) => changes.push(value),
      },
      [
        { value: "alpha", label: "Alpha", mark: "x" },
        { value: "beta", label: "Beta", mark: "x" },
      ],
    );

    items[1]?.press();
    expect(changes).toEqual(["beta"]);
    expect(root.value).toBe("alpha");
    expect(items[0]?.selected).toBe(true);

    root.value = "beta";
    await setup?.renderOnce();
    expect(items[1]?.selected).toBe(true);
    expect(frameLines()[1]).toBe("x Beta");
  });

  it("skips disabled items, wraps with arrows, and supports Home and End", async () => {
    const { items } = await renderGroup({ defaultValue: "alpha" }, [
      { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta", disabled: true },
      { value: "gamma", label: "Gamma" },
    ]);
    const alpha = items[0];
    const beta = items[1];
    const gamma = items[2];
    alpha?.focus();

    await setup?.mockInput.pressArrow("down");
    expect(beta?.focused).toBe(false);
    expect(gamma?.focused).toBe(true);
    expect(gamma?.selected).toBe(true);

    await setup?.mockInput.pressArrow("right");
    expect(alpha?.focused).toBe(true);
    expect(alpha?.selected).toBe(true);

    await setup?.mockInput.pressKey("END");
    expect(gamma?.focused).toBe(true);
    await setup?.mockInput.pressKey("HOME");
    expect(alpha?.focused).toBe(true);
    expect(frameLines()[0]).toBe("o Alpha");
    expect(frameLines()[1]).toBe("  Beta");
  });

  it("falls forward when the focused dynamic item is removed", async () => {
    const { root, items } = await renderGroup({ defaultValue: "beta" }, [
      { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
      { value: "gamma", label: "Gamma" },
    ]);
    const beta = items[1];
    const gamma = items[2];
    beta?.focus();
    expect(beta?.focused).toBe(true);

    beta?.destroy();
    await setup?.renderOnce();

    expect(root.value).toBeNull();
    expect(beta?.focused).toBe(false);
    expect(gamma?.focused).toBe(true);
    expect(frameLines()).not.toContain("  Beta");
    expect(frameLines()[1]).toBe("  Gamma");
  });
});
