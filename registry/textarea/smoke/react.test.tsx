/** @jsxImportSource @opentui/react */

import { afterEach, describe, expect, it } from "bun:test";
import { parseColor } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { TextareaRenderable } from "@tuiparts/core/textarea";
import { act, createRef } from "react";
import { Textarea } from "./components/ui/textarea";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("installed React Textarea recipe", () => {
  it("mounts and routes native submission once", async () => {
    const submissions: string[] = [];
    const ref = createRef<TextareaRenderable>();
    setup = await testRender(
      <Textarea
        ref={ref}
        initialValue="A"
        onSubmit={() => submissions.push(ref.current?.plainText ?? "missing")}
      />,
      { width: 30, height: 8 },
    );
    await act(async () => ref.current?.focus());
    await act(async () => setup?.mockInput.typeText("B"));
    await act(async () => setup?.mockInput.pressEnter({ meta: true }));

    expect(ref.current?.plainText).toBe("BA");
    expect(submissions).toEqual(["BA"]);
    expect(ref.current?.height).toBe(5);
  });

  it("restyles the retained Renderable from the consumer theme", async () => {
    theme.register("smoke", { tokens: { colors: { foreground: "#123456" } } });
    setup = await testRender(<Textarea id="themed" placeholder="Theme" />, {
      width: 30,
      height: 8,
    });
    const textarea = setup.renderer.root.findDescendantById(
      "themed",
    ) as TextareaRenderable;

    await act(async () => theme.setActive("smoke"));
    await setup.waitFor(() => textarea.textColor.equals(parseColor("#123456")));

    expect(setup.renderer.root.findDescendantById("themed")).toBe(textarea);
    await act(async () => theme.setActive("terminal"));
  });
});
