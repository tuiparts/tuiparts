import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createResizableHandle,
  createResizablePanel,
  createResizablePanelGroup,
} from "./components/ui/resizable";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Resizable recipe", () => {
  it("renders panel group with panels and handle", async () => {
    setup = await createTestRenderer({ width: 60, height: 20 });
    const group = createResizablePanelGroup(setup.renderer, {
      direction: "horizontal",
    });
    const panel1 = createResizablePanel(setup.renderer, { defaultSize: 1 });
    const handle = createResizableHandle(setup.renderer, {
      direction: "horizontal",
      withHandle: true,
    });
    const panel2 = createResizablePanel(setup.renderer, { defaultSize: 2 });

    group.add(panel1);
    group.add(handle);
    group.add(panel2);

    setup.renderer.root.add(group);
    await setup.renderOnce();

    expect(group.direction).toBe("horizontal");
    expect(handle.handleText?.plainText).toBe("⁞");
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
    setup = await createTestRenderer({ width: 60, height: 20 });
    const handle = createResizableHandle(setup.renderer, {
      direction: "horizontal",
      withHandle: true,
    });
    setup.renderer.root.add(handle);
    await setup.renderOnce();

    theme.setActive("smoke");
    theme.setActive("terminal");
  });
});
