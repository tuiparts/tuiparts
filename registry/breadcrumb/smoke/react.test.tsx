/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Breadcrumb recipe runtime smoke", () => {
  it("renders breadcrumb trail with links and separators", async () => {
    setup = await testRender(
      <Breadcrumb id="active-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink content="Home" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage content="Docs" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
      { width: 30, height: 3 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("Home")).toBe(true);
    expect(frame.includes("Docs")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
    setup = await testRender(
      <Breadcrumb id="themed-breadcrumb">
        <BreadcrumbItem>
          <BreadcrumbPage content="Active" />
        </BreadcrumbItem>
      </Breadcrumb>,
      { width: 30, height: 3 },
    );
    await act(async () => {
      theme.setActive("smoke");
    });
    await setup.renderOnce();
    await act(async () => {
      theme.setActive("terminal");
    });
  });
});
