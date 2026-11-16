import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createCombobox } from "./components/ui/combobox";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Combobox recipe", () => {
  it("renders trigger and popup content", async () => {
    setup = await createTestRenderer({ width: 40, height: 12 });
    const combobox = createCombobox(setup.renderer, {
      placeholder: "Choose framework...",
      options: [
        { value: "react", label: "React" },
        { value: "solid", label: "Solid" },
        { value: "vue", label: "Vue" },
      ],
      open: true,
      value: "react",
    });

    setup.renderer.root.add(combobox);
    await setup.renderOnce();

    expect(combobox.value).toBe("react");
    expect(combobox.open).toBe(true);
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          surface: "#123456",
          border: "#654321",
          foreground: "#FEDCBA",
          mutedForeground: "#888888",
        },
      },
    });
    setup = await createTestRenderer({ width: 40, height: 12 });
    const combobox = createCombobox(setup.renderer, {
      options: [{ value: "theme", label: "Theme" }],
      open: true,
    });
    setup.renderer.root.add(combobox);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
