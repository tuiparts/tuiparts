/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { MarkdownViewer } from "./components/ui/markdown-viewer";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

const sampleMarkdown = `# Overview
OpenTUI renders rich terminal apps with flexbox layout.
`;

test("installed React MarkdownViewer recipe renders markdown with header", async () => {
  setup = await testRender(
    <MarkdownViewer
      content={sampleMarkdown}
      title="README.md"
      width={60}
      height={10}
    />,
    { width: 60, height: 10 },
  );
  await setup.renderOnce();

  const output = setup.captureCharFrame();
  expect(output).toContain("README.md");
  expect(output).toContain("MD");
});
