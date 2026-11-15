import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createBreadcrumb,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbList,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Breadcrumb recipe", () => {
  it("renders breadcrumb trail with links and separators", async () => {
    setup = await createTestRenderer({ width: 40, height: 3 });
    const root = createBreadcrumb(setup.renderer);
    const list = createBreadcrumbList(setup.renderer);

    const item1 = createBreadcrumbItem(setup.renderer);
    const link1 = createBreadcrumbLink(setup.renderer, { content: "Home" });
    item1.add(link1);

    const sep1 = createBreadcrumbSeparator(setup.renderer);

    const item2 = createBreadcrumbItem(setup.renderer);
    const page = createBreadcrumbPage(setup.renderer, { content: "Docs" });
    item2.add(page);

    list.add(item1);
    list.add(sep1);
    list.add(item2);
    root.add(list);

    setup.renderer.root.add(root);
    await setup.renderOnce();

    expect(link1.textNode?.plainText).toBe("Home");
    expect(sep1.textNode?.plainText).toBe("›");
    expect(page.textNode?.plainText).toBe("Docs");

    const frame = setup.captureCharFrame();
    expect(frame.includes("Home")).toBe(true);
    expect(frame.includes("Docs")).toBe(true);
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          foreground: "#123456",
          mutedForeground: "#654321",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 3 });
    const root = createBreadcrumb(setup.renderer);
    const link = createBreadcrumbLink(setup.renderer, { content: "Link" });
    const page = createBreadcrumbPage(setup.renderer, { content: "Page" });
    root.add(link);
    root.add(page);
    setup.renderer.root.add(root);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(link.textNode?.fg.equals(parseColor("#654321"))).toBe(true);
    expect(page.textNode?.fg.equals(parseColor("#123456"))).toBe(true);

    theme.setActive("terminal");
  });
});
