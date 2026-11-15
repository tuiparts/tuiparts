import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { createMarkdownViewer } from "./components/ui/markdown-viewer";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

const sampleMarkdown = `# Overview
OpenTUI renders rich terminal apps with flexbox layout.
`;

describe("installed Core MarkdownViewer recipe", () => {
  it("renders markdown document with title header", async () => {
    setup = await createTestRenderer({ width: 60, height: 10 });
    const viewer = createMarkdownViewer(setup.renderer, {
      content: sampleMarkdown,
      title: "README.md",
    });
    setup.renderer.root.add(viewer);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("README.md");
    expect(output).toContain("MD");
  });
});
