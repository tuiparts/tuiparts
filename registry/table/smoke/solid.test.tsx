/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Table recipe runtime smoke", () => {
  it("renders table with header, rows, and cells", async () => {
    setup = await testRender(
      () => (
        <Table id="active-table">
          <TableHeader>
            <TableRow>
              <TableHead content="Item" />
              <TableHead content="Status" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell content="Task 1" />
              <TableCell content="Done" />
            </TableRow>
          </TableBody>
          <TableCaption content="Tasks list" />
        </Table>
      ),
      { width: 40, height: 10 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("Item")).toBe(true);
    expect(frame.includes("Task 1")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { border: "#123456" } } });
    setup = await testRender(
      () => (
        <Table id="themed-table">
          <TableRow>
            <TableCell content="Sample" />
          </TableRow>
        </Table>
      ),
      { width: 30, height: 5 },
    );
    theme.setActive("smoke");
    await setup.renderOnce();
    theme.setActive("terminal");
  });
});
