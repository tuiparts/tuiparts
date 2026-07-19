import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createTextarea } from "./components/ui/textarea";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Textarea recipe", () => {
  it("mounts and preserves native multiline editing and submission", async () => {
    setup = await createTestRenderer({ width: 30, height: 8 });
    const submissions: string[] = [];
    const textarea = createTextarea(setup.renderer, {
      initialValue: "A",
      onSubmit: () => submissions.push(textarea.plainText),
    });
    setup.renderer.root.add(textarea);
    textarea.focus();

    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter();
    setup.mockInput.pressEnter({ meta: true });

    expect(textarea.plainText).toBe("B\nA");
    expect(submissions).toEqual(["B\nA"]);
    expect(textarea.height).toBe(5);
    expect(textarea.wrapMode).toBe("word");
  });

  it("restyles from the consumer theme", async () => {
    theme.register("smoke", {
      tokens: {
        colors: { foreground: "#123456", mutedForeground: "#654321" },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 8 });
    const textarea = createTextarea(setup.renderer, { placeholder: "Theme" });
    setup.renderer.root.add(textarea);

    theme.setActive("smoke");
    expect(textarea.textColor.equals(parseColor("#123456"))).toBe(true);
    expect(textarea.placeholderColor.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
  });
});
