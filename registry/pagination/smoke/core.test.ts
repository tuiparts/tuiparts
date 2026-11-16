import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createPagination,
  createPaginationContent,
  createPaginationEllipsis,
  createPaginationItem,
  createPaginationLink,
  createPaginationNext,
  createPaginationPrevious,
} from "./components/ui/pagination";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Pagination recipe", () => {
  it("renders pagination links and controls", async () => {
    setup = await createTestRenderer({ width: 50, height: 5 });
    const pagination = createPagination(setup.renderer);
    const content = createPaginationContent(setup.renderer);

    const prev = createPaginationPrevious(setup.renderer);
    const item1 = createPaginationItem(setup.renderer);
    item1.add(
      createPaginationLink(setup.renderer, { label: "1", isActive: true }),
    );
    const item2 = createPaginationItem(setup.renderer);
    item2.add(createPaginationLink(setup.renderer, { label: "2" }));
    const ellipsis = createPaginationEllipsis(setup.renderer);
    const next = createPaginationNext(setup.renderer);

    content.add(prev);
    content.add(item1);
    content.add(item2);
    content.add(ellipsis);
    content.add(next);
    pagination.add(content);
    setup.renderer.root.add(pagination);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("Previous");
    expect(output).toContain("1");
    expect(output).toContain("2");
    expect(output).toContain("Next");
  });
});
