/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { TextareaRenderable } from "@tuiparts/core/textarea";
import { Textarea } from "./components/ui/textarea";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Textarea recipe", () => {
  it("mounts and routes native submission once", async () => {
    const submissions: string[] = [];
    let textarea: TextareaRenderable | undefined;
    setup = await testRender(
      () => (
        <Textarea
          ref={(value) => {
            textarea = value;
          }}
          initialValue="A"
          onSubmit={() => submissions.push(textarea?.plainText ?? "missing")}
        />
      ),
      { width: 30, height: 8 },
    );
    textarea?.focus();
    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter({ meta: true });

    expect(textarea?.plainText).toBe("BA");
    expect(submissions).toEqual(["BA"]);
    expect(textarea?.height).toBe(5);
  });

  it("restyles the retained Renderable from the consumer theme", async () => {
    theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
    setup = await testRender(
      () => <Textarea id="themed" placeholder="Theme" />,
      {
        width: 30,
        height: 8,
      },
    );
    const textarea = setup.renderer.root.findDescendantById(
      "themed",
    ) as TextareaRenderable;

    theme.setActive("smoke");
    await setup.waitFor(() => textarea.textColor.equals(parseColor("#123456")));

    expect(setup.renderer.root.findDescendantById("themed")).toBe(textarea);
    theme.setActive("terminal");
  });
});
