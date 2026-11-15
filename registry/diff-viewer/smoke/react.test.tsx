/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { DiffViewer } from "./components/ui/diff-viewer";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

const sampleDiff = `--- a/index.ts
+++ b/index.ts
@@ -1 +1 @@
-const hello = "world";
+const hello = "open-tui";
`;

test("installed React DiffViewer recipe renders patch with header", async () => {
  setup = await testRender(
    <DiffViewer
      diff={sampleDiff}
      title="index.ts"
      view="unified"
      width={60}
      height={10}
    />,
    { width: 60, height: 10 },
  );
  await setup.renderOnce();

  const output = setup.captureCharFrame();
  expect(output).toContain("index.ts");
  expect(output).toContain("UNIFIED");
  expect(output).toContain("open-tui");
  expect(output).not.toContain("Error parsing diff");
});
