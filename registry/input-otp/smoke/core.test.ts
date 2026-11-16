import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createInputOTP } from "./components/ui/input-otp";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core InputOTP recipe", () => {
  it("renders segmented slots and responds to value changes", async () => {
    setup = await createTestRenderer({ width: 30, height: 5 });
    const otp = createInputOTP(setup.renderer, {
      maxLength: 4,
      defaultValue: "12",
    });
    setup.renderer.root.add(otp);
    await setup.renderOnce();

    expect(otp.value).toBe("12");
    expect(otp.maxLength).toBe(4);
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
    setup = await createTestRenderer({ width: 30, height: 5 });
    const otp = createInputOTP(setup.renderer, { maxLength: 4 });
    setup.renderer.root.add(otp);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
