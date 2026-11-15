/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import { Spinner } from "./components/ui/spinner";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Spinner recipe runtime smoke", () => {
  it("renders with indicator and label", async () => {
    setup = await testRender(
      <Spinner
        id="active-spinner"
        label="Loading..."
        running={false}
        preset="dots"
      />,
      { width: 30, height: 3 },
    );
    await setup.renderOnce();
    expect(
      setup.captureCharFrame().split("\n")[0]?.includes("Loading..."),
    ).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { primary: "#123456" } } });
    setup = await testRender(
      <Spinner id="themed-spinner" intent="primary" running={false} />,
      {
        width: 30,
        height: 3,
      },
    );
    theme.setActive("smoke");
    await setup.renderOnce();
    theme.setActive("terminal");
  });
});
