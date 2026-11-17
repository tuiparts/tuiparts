import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createSelect } from "./components/ui/select";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Select recipe", () => {
  it("renders trigger and responds to options", async () => {
    setup = await createTestRenderer({ width: 30, height: 8 });
    const select = createSelect(setup.renderer, {
      options: [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
      ],
      value: "apple",
    });
    setup.renderer.root.add(select);
    await setup.renderOnce();

    expect(select.value).toBe("apple");
    expect(select.options.length).toBe(2);
  });

  it("restyles on theme switch", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          primary: "#654321",
          foreground: "#FEDCBA",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 8 });
    const select = createSelect(setup.renderer, {
      options: [{ value: "1", label: "One" }],
    });
    setup.renderer.root.add(select);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
