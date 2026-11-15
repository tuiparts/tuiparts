/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { ASCIIBanner } from "./components/ui/ascii-banner";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React ASCIIBanner recipe renders banner with subtitle", async () => {
  setup = await testRender(
    <ASCIIBanner
      text="TUI"
      font="tiny"
      subtitle="tuiparts.sh"
      width={60}
      height={10}
    />,
    { width: 60, height: 10 },
  );
  await setup.renderOnce();

  const output = setup.captureCharFrame();
  expect(output).toContain("tuiparts.sh");
});
