import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createAvatar, createAvatarFallback } from "./components/ui/avatar";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Avatar recipe", () => {
  it("renders avatar with initials fallback", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    const avatar = createAvatar(setup.renderer, { size: "default" });
    const fallback = createAvatarFallback(setup.renderer, { content: "TP" });
    avatar.add(fallback);

    setup.renderer.root.add(avatar);
    await setup.renderOnce();

    expect(fallback.textNode?.plainText).toBe("TP");

    const frame = setup.captureCharFrame();
    expect(frame.includes("TP")).toBe(true);
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          foreground: "#654321",
          surface: "#abcdef",
        },
      },
    });
    setup = await createTestRenderer({ width: 20, height: 5 });
    const avatar = createAvatar(setup.renderer);
    const fallback = createAvatarFallback(setup.renderer, { content: "TP" });
    avatar.add(fallback);
    setup.renderer.root.add(avatar);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(avatar.borderColor.equals(parseColor("#123456"))).toBe(true);
    expect(avatar.backgroundColor.equals(parseColor("#abcdef"))).toBe(true);
    expect(fallback.textNode?.fg.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
  });
});
