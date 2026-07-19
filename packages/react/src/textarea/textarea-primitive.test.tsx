import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import type { TextareaRenderable } from "@tuiparts/core/textarea";
import {
  act,
  createElement,
  createRef,
  type RefObject,
  StrictMode,
  useState,
} from "react";
import { Textarea } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

describe("React Textarea", () => {
  it("routes native editing and submission without adapter duplication", async () => {
    const events: string[] = [];
    const ref = createRef<TextareaRenderable>();
    setup = await testRender(
      createElement(Textarea, {
        ref,
        initialValue: "A",
        onContentChange: () => events.push(`content:${ref.current?.plainText}`),
        onSubmit: () => events.push(`submit:${ref.current?.plainText}`),
      }),
      { width: 30, height: 6 },
    );
    await act(async () => ref.current?.focus());
    await act(async () => setup?.mockInput.typeText("B"));
    await act(async () => setup?.mockInput.pressEnter({ meta: true }));

    expect(ref.current?.plainText).toBe("BA");
    expect(events).toEqual(["content:A", "content:BA", "submit:BA"]);
  });

  it("updates props and callbacks on one Renderable and EditBuffer", async () => {
    const firstEvents: string[] = [];
    const secondEvents: string[] = [];
    const ref = createRef<TextareaRenderable>();
    let setDisabled: ((value: boolean) => void) | undefined;
    let setPhase: ((value: "first" | "second" | "removed") => void) | undefined;
    function App() {
      const [disabled, updateDisabled] = useState(false);
      const [phase, updatePhase] = useState<"first" | "second" | "removed">(
        "first",
      );
      setDisabled = updateDisabled;
      setPhase = updatePhase;
      const onSubmit =
        phase === "first"
          ? () => firstEvents.push("submit")
          : phase === "second"
            ? () => secondEvents.push("submit")
            : undefined;
      return createElement(Textarea, { ref, disabled, onSubmit });
    }
    setup = await testRender(createElement(App), { width: 30, height: 6 });
    const retained = ref.current;
    const editBuffer = ref.current?.editBuffer;

    await act(async () => setDisabled?.(true));
    await setup.waitFor(() => ref.current?.disabled === true);
    expect(ref.current).toBe(retained);
    expect(ref.current?.editBuffer).toBe(editBuffer);
    expect(ref.current?.focusable).toBe(false);

    await act(async () => setDisabled?.(false));
    await act(async () => setPhase?.("second"));
    ref.current?.submit();
    expect(firstEvents).toEqual([]);
    expect(secondEvents).toEqual(["submit"]);

    await act(async () => setPhase?.("removed"));
    ref.current?.submit();
    expect(secondEvents).toEqual(["submit"]);
  });

  it("safely removes optional native editor overrides", async () => {
    const ref = createRef<TextareaRenderable>();
    const submissions: string[] = [];
    let removeOverrides: (() => void) | undefined;
    function App() {
      const [custom, setCustom] = useState(true);
      removeOverrides = () => setCustom(false);
      return createElement(Textarea, {
        ref,
        attributes: custom ? 1 : undefined,
        cursorColor: custom ? "#FF0000" : undefined,
        cursorStyle: custom ? { style: "line", blinking: false } : undefined,
        keyAliasMap: custom ? { return: "x" } : undefined,
        keyBindings: custom ? [{ name: "q", action: "submit" }] : undefined,
        scrollMargin: custom ? 0.5 : undefined,
        scrollSpeed: custom ? 4 : undefined,
        selectable: custom ? false : undefined,
        showCursor: custom ? false : undefined,
        wrapMode: custom ? "none" : undefined,
        onSubmit: () => submissions.push("submit"),
      });
    }
    setup = await testRender(createElement(App), { width: 30, height: 6 });
    const retained = ref.current;
    const editBuffer = ref.current?.editBuffer;
    await act(async () => ref.current?.focus());
    await act(async () => setup?.mockInput.typeText("q"));
    await act(async () => setup?.mockInput.typeText("x"));

    expect(submissions).toEqual(["submit"]);
    expect(ref.current?.plainText).toBe("\n");

    await act(async () => removeOverrides?.());
    await act(async () => setup?.mockInput.typeText("xq"));

    expect(ref.current).toBe(retained);
    expect(ref.current?.editBuffer).toBe(editBuffer);
    expect(ref.current?.plainText).toBe("\nxq");
    expect(submissions).toEqual(["submit"]);
    expect(ref.current?.attributes).toBe(0);
    expect(ref.current?.cursorColor.toInts()).toEqual([255, 255, 255, 255]);
    expect(ref.current?.cursorStyle).toEqual({
      style: "block",
      blinking: true,
    });
    expect(ref.current?.scrollMargin).toBe(0.2);
    expect(ref.current?.scrollSpeed).toBe(16);
    expect(ref.current?.selectable).toBe(true);
    expect(ref.current?.showCursor).toBe(true);
    expect(ref.current?.wrapMode).toBe("word");
  });

  it("restores the public and native tab indicator when its key is omitted", async () => {
    const ref = createRef<TextareaRenderable>();
    let omitTabIndicator: (() => void) | undefined;
    function App() {
      const [custom, setCustom] = useState(true);
      omitTabIndicator = () => setCustom(false);
      return createElement(Textarea, {
        ref,
        height: 1,
        initialValue: "\t",
        tabIndicatorColor: "#00FF00",
        width: 8,
        ...(custom ? { tabIndicator: ">" } : {}),
      });
    }
    setup = await testRender(createElement(App), { width: 8, height: 1 });
    const retained = ref.current;
    const editBuffer = ref.current?.editBuffer;
    await setup.renderOnce();
    expect(setup.captureCharFrame().startsWith(">")).toBe(true);

    await act(async () => omitTabIndicator?.());
    await setup.waitFor(() => ref.current?.tabIndicator === undefined);
    await setup.renderOnce();

    expect(ref.current).toBe(retained);
    expect(ref.current?.editBuffer).toBe(editBuffer);
    expect(ref.current?.tabIndicator).toBeUndefined();
    expect(ref.current?.tabIndicatorColor?.toInts()).toEqual([0, 255, 0, 255]);
    expect(setup.captureCharFrame().startsWith(" ")).toBe(true);
  });

  it("restores the public and native tab indicator color when its key is omitted", async () => {
    const ref = createRef<TextareaRenderable>();
    let omitTabIndicatorColor: (() => void) | undefined;
    function App() {
      const [custom, setCustom] = useState(true);
      omitTabIndicatorColor = () => setCustom(false);
      return createElement(Textarea, {
        ref,
        height: 1,
        initialValue: "\t",
        tabIndicator: ">",
        width: 8,
        ...(custom ? { tabIndicatorColor: "#00FF00" } : {}),
      });
    }
    setup = await testRender(createElement(App), { width: 8, height: 1 });
    const retained = ref.current;
    const editBuffer = ref.current?.editBuffer;
    await setup.renderOnce();
    const customIndicatorSpan = setup
      .captureSpans()
      .lines[0]?.spans.find(({ text }) => text.includes(">"));
    expect(ref.current?.tabIndicatorColor?.toInts()).toEqual([0, 255, 0, 255]);
    expect(customIndicatorSpan?.fg.toInts()).toEqual([0, 255, 0, 255]);

    await act(async () => omitTabIndicatorColor?.());
    await setup.waitFor(() => ref.current?.tabIndicatorColor === undefined);
    await setup.renderOnce();
    const indicatorSpan = setup
      .captureSpans()
      .lines[0]?.spans.find(({ text }) => text.includes(">"));

    expect(ref.current).toBe(retained);
    expect(ref.current?.editBuffer).toBe(editBuffer);
    expect(ref.current?.tabIndicator).toBe(">");
    expect(ref.current?.tabIndicatorColor).toBeUndefined();
    expect(indicatorSpan?.fg.toInts()).toEqual([255, 255, 255, 255]);
  });

  it("restores boolean disabled when the prop is omitted", async () => {
    const ref = createRef<TextareaRenderable>();
    let omitDisabled: (() => void) | undefined;
    function App() {
      const [disabled, setDisabled] = useState(true);
      omitDisabled = () => setDisabled(false);
      return createElement(Textarea, {
        ref,
        ...(disabled ? { disabled: true } : {}),
      });
    }
    setup = await testRender(createElement(App), { width: 30, height: 6 });
    const retained = ref.current;
    const editBuffer = ref.current?.editBuffer;

    await act(async () => omitDisabled?.());
    await setup.waitFor(() => ref.current?.disabled === false);

    expect(ref.current).toBe(retained);
    expect(ref.current?.editBuffer).toBe(editBuffer);
    expect(ref.current?.disabled).toBe(false);
    expect(typeof ref.current?.disabled).toBe("boolean");
  });

  it("sets and clears a ref to the actual Core Renderable", async () => {
    const ref: RefObject<TextareaRenderable | null> = createRef();
    setup = await testRender(createElement(Textarea, { ref }), {
      width: 30,
      height: 6,
    });
    const textarea = ref.current;

    expect(textarea?.editBuffer).toBeDefined();
    await act(async () => setup?.renderer.destroy());

    expect(textarea?.isDestroyed).toBe(true);
    expect(ref.current).toBeNull();
    setup = undefined;
  });

  it("mounts one retained native editor under Strict Mode", async () => {
    const ref = createRef<TextareaRenderable>();
    setup = await testRender(
      createElement(
        StrictMode,
        null,
        createElement(Textarea, { id: "strict-textarea", ref }),
      ),
      { width: 30, height: 6 },
    );

    expect(setup.renderer.root.findDescendantById("strict-textarea")).toBe(
      ref.current ?? undefined,
    );
    expect(ref.current?.isDestroyed).toBe(false);
  });
});
