import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createInputGroup,
  createInputGroupAddon,
  createInputGroupText,
} from "./components/ui/input-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core InputGroup recipe", () => {
  it("renders group with prefix addon and text", async () => {
    setup = await createTestRenderer({ width: 30, height: 3 });
    const group = createInputGroup(setup.renderer);
    const addon = createInputGroupAddon(setup.renderer);
    const text = createInputGroupText(setup.renderer, { content: "https://" });
    addon.add(text);
    group.add(addon);

    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(text.textNode?.plainText).toBe("https://");

    const frame = setup.captureCharFrame();
    expect(frame.includes("https://")).toBe(true);
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          mutedForeground: "#654321",
          surface: "#abcdef",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const group = createInputGroup(setup.renderer);
    const addon = createInputGroupAddon(setup.renderer);
    const text = createInputGroupText(setup.renderer, { content: "Prefix" });
    addon.add(text);
    group.add(addon);
    setup.renderer.root.add(group);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(group.borderColor.equals(parseColor("#123456"))).toBe(true);
    expect(addon.backgroundColor.equals(parseColor("#abcdef"))).toBe(true);
    expect(text.textNode?.fg.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
  });
});
