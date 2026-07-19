/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import type { TextareaRenderable } from "@tuiparts/core/textarea";
import { createSignal } from "solid-js";
import { Textarea } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Textarea", () => {
  it("routes native editing and submission without adapter duplication", async () => {
    const events: string[] = [];
    let textarea: TextareaRenderable | undefined;
    setup = await testRender(
      () => (
        <Textarea
          ref={(value) => {
            textarea = value;
          }}
          initialValue="A"
          onContentChange={() => events.push(`content:${textarea?.plainText}`)}
          onSubmit={() => events.push(`submit:${textarea?.plainText}`)}
        />
      ),
      { width: 30, height: 6 },
    );
    textarea?.focus();
    await setup.mockInput.typeText("B");
    setup.mockInput.pressEnter({ meta: true });

    expect(textarea?.plainText).toBe("BA");
    expect(events).toEqual(["content:A", "content:BA", "submit:BA"]);
  });

  it("reactively replaces and removes props on one Renderable and EditBuffer", async () => {
    const firstEvents: string[] = [];
    const secondEvents: string[] = [];
    let textarea: TextareaRenderable | undefined;
    let setDisabled: (value: boolean) => void = () => {};
    let setPhase: (value: "first" | "second" | "removed") => void = () => {};
    setup = await testRender(
      () => {
        const [disabled, updateDisabled] = createSignal(false);
        const [phase, updatePhase] = createSignal<
          "first" | "second" | "removed"
        >("first");
        setDisabled = updateDisabled;
        setPhase = updatePhase;
        return (
          <Textarea
            ref={(value) => {
              textarea = value;
            }}
            disabled={disabled()}
            onSubmit={
              phase() === "first"
                ? () => firstEvents.push("submit")
                : phase() === "second"
                  ? () => secondEvents.push("submit")
                  : undefined
            }
          />
        );
      },
      { width: 30, height: 6 },
    );
    const retained = textarea;
    const editBuffer = textarea?.editBuffer;

    setDisabled(true);
    await setup.waitFor(() => textarea?.disabled === true);
    expect(textarea).toBe(retained);
    expect(textarea?.editBuffer).toBe(editBuffer);
    expect(textarea?.focusable).toBe(false);

    setDisabled(false);
    setPhase("second");
    textarea?.submit();
    expect(firstEvents).toEqual([]);
    expect(secondEvents).toEqual(["submit"]);

    setPhase("removed");
    textarea?.submit();
    expect(secondEvents).toEqual(["submit"]);
  });

  it("safely removes optional native editor overrides", async () => {
    let textarea: TextareaRenderable | undefined;
    const submissions: string[] = [];
    let removeOverrides: () => void = () => {};
    setup = await testRender(
      () => {
        const [custom, setCustom] = createSignal(true);
        removeOverrides = () => setCustom(false);
        return (
          <Textarea
            ref={(value) => {
              textarea = value;
            }}
            attributes={custom() ? 1 : undefined}
            cursorColor={custom() ? "#FF0000" : undefined}
            cursorStyle={
              custom() ? { style: "line", blinking: false } : undefined
            }
            keyAliasMap={custom() ? { return: "x" } : undefined}
            keyBindings={
              custom() ? [{ name: "q", action: "submit" }] : undefined
            }
            scrollMargin={custom() ? 0.5 : undefined}
            scrollSpeed={custom() ? 4 : undefined}
            selectable={custom() ? false : undefined}
            showCursor={custom() ? false : undefined}
            tabIndicator={custom() ? ">" : undefined}
            tabIndicatorColor={custom() ? "#00FF00" : undefined}
            wrapMode={custom() ? "none" : undefined}
            onSubmit={() => submissions.push("submit")}
          />
        );
      },
      { width: 30, height: 6 },
    );
    const retained = textarea;
    const editBuffer = textarea?.editBuffer;
    textarea?.focus();
    await setup.mockInput.typeText("q");
    await setup.mockInput.typeText("x");

    expect(submissions).toEqual(["submit"]);
    expect(textarea?.plainText).toBe("\n");

    removeOverrides();
    await setup.waitFor(() => textarea?.cursorStyle.style === "block");
    await setup.mockInput.typeText("xq");

    expect(textarea).toBe(retained);
    expect(textarea?.editBuffer).toBe(editBuffer);
    expect(textarea?.plainText).toBe("\nxq");
    expect(submissions).toEqual(["submit"]);
    expect(textarea?.attributes).toBe(0);
    expect(textarea?.cursorColor.toInts()).toEqual([255, 255, 255, 255]);
    expect(textarea?.cursorStyle).toEqual({ style: "block", blinking: true });
    expect(textarea?.scrollMargin).toBe(0.2);
    expect(textarea?.scrollSpeed).toBe(16);
    expect(textarea?.selectable).toBe(true);
    expect(textarea?.showCursor).toBe(true);
    expect(textarea?.tabIndicator).toBeUndefined();
    expect(textarea?.tabIndicatorColor).toBeUndefined();
    expect(textarea?.wrapMode).toBe("word");
  });

  it("restores boolean disabled when the prop is omitted", async () => {
    let textarea: TextareaRenderable | undefined;
    let omitDisabled: () => void = () => {};
    setup = await testRender(
      () => {
        const [disabled, setDisabled] = createSignal(true);
        omitDisabled = () => setDisabled(false);
        return (
          <Textarea
            ref={(value) => {
              textarea = value;
            }}
            {...(disabled() ? { disabled: true } : {})}
          />
        );
      },
      { width: 30, height: 6 },
    );
    const retained = textarea;
    const editBuffer = textarea?.editBuffer;

    omitDisabled();
    await setup.waitFor(() => textarea?.disabled === false);

    expect(textarea).toBe(retained);
    expect(textarea?.editBuffer).toBe(editBuffer);
    expect(textarea?.disabled).toBe(false);
    expect(typeof textarea?.disabled).toBe("boolean");
  });

  it("destroys the actual Core Renderable during cleanup", async () => {
    let textarea: TextareaRenderable | undefined;
    setup = await testRender(
      () => (
        <Textarea
          ref={(value) => {
            textarea = value;
          }}
        />
      ),
      { width: 30, height: 6 },
    );
    const retained = textarea;

    setup.renderer.destroy();

    expect(retained?.isDestroyed).toBe(true);
    setup = undefined;
  });
});
