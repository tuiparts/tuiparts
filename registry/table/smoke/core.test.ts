import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createTable,
  createTableBody,
  createTableCaption,
  createTableCell,
  createTableHead,
  createTableHeader,
  createTableRow,
} from "./components/ui/table";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Table recipe", () => {
  it("renders compound table structure", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const table = createTable(setup.renderer);
    const header = createTableHeader(setup.renderer);
    const headerRow = createTableRow(setup.renderer);
    const head1 = createTableHead(setup.renderer, { content: "Name" });
    const head2 = createTableHead(setup.renderer, { content: "Role" });
    headerRow.add(head1);
    headerRow.add(head2);
    header.add(headerRow);

    const body = createTableBody(setup.renderer);
    const bodyRow = createTableRow(setup.renderer);
    const cell1 = createTableCell(setup.renderer, { content: "Alice" });
    const cell2 = createTableCell(setup.renderer, { content: "Admin" });
    bodyRow.add(cell1);
    bodyRow.add(cell2);
    body.add(bodyRow);

    const caption = createTableCaption(setup.renderer, {
      content: "Team Members",
    });

    table.add(header);
    table.add(body);
    table.add(caption);

    setup.renderer.root.add(table);
    await setup.renderOnce();

    expect(head1.textNode?.plainText).toBe("Name");
    expect(cell1.textNode?.plainText).toBe("Alice");
    expect(caption.textNode?.plainText).toBe("Team Members");
  });

  it("updates styling on theme change", async () => {
    theme.register("smoke", {
      tokens: {
        colors: {
          border: "#123456",
          foreground: "#654321",
          mutedForeground: "#888888",
        },
      },
    });
    setup = await createTestRenderer({ width: 30, height: 5 });
    const table = createTable(setup.renderer);
    const head = createTableHead(setup.renderer, { content: "Head" });
    const cell = createTableCell(setup.renderer, { content: "Cell" });
    table.add(head);
    table.add(cell);
    setup.renderer.root.add(table);
    await setup.renderOnce();

    theme.setActive("smoke");
    expect(table.borderColor.equals(parseColor("#123456"))).toBe(true);
    expect(head.textNode?.fg.equals(parseColor("#888888"))).toBe(true);
    expect(cell.textNode?.fg.equals(parseColor("#654321"))).toBe(true);

    theme.setActive("terminal");
  });
});
