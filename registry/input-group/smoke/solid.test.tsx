/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "./components/ui/input-group";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid InputGroup recipe runtime smoke", () => {
  it("renders group with prefix addon and text", async () => {
    setup = await testRender(
      () => (
        <InputGroup id="test-group">
          <InputGroupAddon>
            <InputGroupText content="https://" />
          </InputGroupAddon>
        </InputGroup>
      ),
      { width: 30, height: 3 },
    );
    await setup.renderOnce();
    const frame = setup.captureCharFrame();
    expect(frame.includes("https://")).toBe(true);
  });

  it("updates styling on theme switch", async () => {
    theme.register("smoke", { tokens: { colors: { border: "#123456" } } });
    setup = await testRender(
      () => (
        <InputGroup id="themed-group">
          <InputGroupAddon>
            <InputGroupText content="Themed" />
          </InputGroupAddon>
        </InputGroup>
      ),
      { width: 30, height: 3 },
    );
    theme.setActive("smoke");
    await setup.renderOnce();
    theme.setActive("terminal");
  });
});
