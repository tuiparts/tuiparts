import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createDiffViewer } from "./components/ui/diff-viewer";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

const sampleDiff = `--- a/index.ts
+++ b/index.ts
@@ -1 +1 @@
-const hello = "world";
+const hello = "open-tui";
`;

describe("installed Core DiffViewer recipe", () => {
  it("renders diff patch with title header", async () => {
    setup = await createTestRenderer({ width: 60, height: 10 });
    const viewer = createDiffViewer(setup.renderer, {
      diff: sampleDiff,
      title: "index.ts",
      view: "unified",
    });
    setup.renderer.root.add(viewer);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("index.ts");
    expect(output).toContain("UNIFIED");
    expect(output).toContain("open-tui");
    expect(output).not.toContain("Error parsing diff");
  });
});
