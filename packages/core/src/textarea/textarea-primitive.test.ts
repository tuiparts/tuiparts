import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { TextareaRenderable } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

async function createTextarea(
  options: ConstructorParameters<typeof TextareaRenderable>[1] = {},
): Promise<TextareaRenderable> {
  setup = await createTestRenderer({ width: 30, height: 6 });
  const textarea = new TextareaRenderable(setup.renderer, options);
  setup.renderer.root.add(textarea);
  return textarea;
}

describe("TextareaRenderable", () => {
  it("preserves native initialValue and EditBuffer ownership", async () => {
    const events: string[] = [];
    const textarea = await createTextarea({
      initialValue: "alpha\nbeta",
      onContentChange: () => events.push("content"),
      onCursorChange: () => events.push("cursor"),
      onSubmit: () => events.push("submit"),
    });
    const editBuffer = textarea.editBuffer;

    expect(textarea.plainText).toBe("alpha\nbeta");
    expect(events).toEqual(["cursor", "content"]);

    textarea.initialValue = "ignored";
    textarea.replaceText("next");

    expect(textarea.plainText).toBe("next");
    expect(textarea.editBuffer).toBe(editBuffer);
  });

  it("preserves native cursor, content, newline, and submit order", async () => {
    const events: string[] = [];
    let textarea: TextareaRenderable | undefined;
    textarea = await createTextarea({
      initialValue: "A",
      onCursorChange: ({ line, visualColumn }) =>
        events.push(`cursor:${line}:${visualColumn}`),
      onContentChange: () => events.push(`content:${textarea?.plainText}`),
      onSubmit: () => events.push(`submit:${textarea?.plainText}`),
    });
    textarea.focus();
    await setup?.renderOnce();
    events.length = 0;

    await setup?.mockInput.typeText("B");
    setup?.mockInput.pressEnter();
    setup?.mockInput.pressEnter({ meta: true });

    expect(textarea.plainText).toBe("B\nA");
    expect(events).toEqual(["cursor:0:1", "content:BA", "submit:B\nA"]);
  });

  it("preserves native paste handling", async () => {
    const textarea = await createTextarea();
    textarea.focus();

    await setup?.mockInput.pasteBracketedText("first\nsecond");

    expect(textarea.plainText).toBe("first\nsecond");
  });

  it("gates focus, keyboard editing, paste, and submit while disabled", async () => {
    const events: string[] = [];
    const textarea = await createTextarea({
      disabled: true,
      initialValue: "fixed",
      onContentChange: () => events.push("content"),
      onSubmit: () => events.push("submit"),
    });
    await setup?.renderOnce();
    events.length = 0;

    expect(textarea.focusable).toBe(false);
    expect(textarea.traits.suspend).toBe(true);
    textarea.focus();
    await setup?.mockInput.typeText("x");
    await setup?.mockInput.pasteBracketedText("pasted");

    expect(textarea.focused).toBe(false);
    expect(textarea.plainText).toBe("fixed");
    expect(textarea.submit()).toBe(false);
    expect(events).toEqual([]);

    textarea.disabled = false;
    textarea.focus();
    await setup?.mockInput.typeText("x");

    expect(textarea.focusable).toBe(true);
    expect(textarea.traits.suspend).toBe(false);
    expect(textarea.focused).toBe(true);
    expect(textarea.plainText).toBe("xfixed");

    textarea.disabled = true;
    expect(textarea.focused).toBe(false);
  });

  it("keeps programmatic EditBuffer operations native while disabled", async () => {
    const textarea = await createTextarea({ disabled: true });

    textarea.setText("programmatic");
    textarea.insertText(" edit");

    expect(textarea.plainText).toBe(" editprogrammatic");
  });

  it("gates pointer selection and wheel scrolling when initially disabled", async () => {
    const textarea = await createTextarea({
      disabled: true,
      height: 2,
      initialValue: "first\nsecond\nthird\nfourth",
      width: 12,
    });
    await setup?.renderOnce();
    const cursor = textarea.cursorOffset;
    const scrollY = textarea.scrollY;

    await setup?.mockMouse.drag(0, 0, 6, 1);
    await setup?.mockMouse.scroll(1, 1, "down");

    expect(textarea.cursorOffset).toBe(cursor);
    expect(textarea.getSelection()).toBeNull();
    expect(textarea.scrollY).toBe(scrollY);
  });

  it("gates an active pointer drag and wheel scrolling after disabling", async () => {
    const textarea = await createTextarea({
      height: 2,
      initialValue: "first\nsecond\nthird\nfourth",
      width: 12,
    });
    await setup?.renderOnce();

    await setup?.mockMouse.scroll(1, 1, "down");
    expect(textarea.scrollY).toBeGreaterThan(0);
    await setup?.mockMouse.pressDown(1, 0);
    const rendererSelection = setup?.renderer.getSelection();
    expect(rendererSelection?.isDragging).toBe(true);
    expect(rendererSelection?.touchedRenderables).toContain(textarea);
    const cursor = textarea.cursorOffset;
    const selection = textarea.getSelection();
    const scrollY = textarea.scrollY;
    textarea.disabled = true;

    expect(setup?.renderer.getSelection()).toBeNull();
    expect(textarea.getSelection()).toEqual(selection);

    await setup?.mockMouse.moveTo(7, 1);
    expect(setup?.renderer.getSelection()).toBeNull();
    await setup?.mockMouse.release(7, 1);
    expect(setup?.renderer.getSelection()).toBeNull();
    await setup?.mockMouse.scroll(1, 1, "up");

    expect(textarea.cursorOffset).toBe(cursor);
    expect(textarea.getSelection()).toEqual(selection);
    expect(textarea.scrollY).toBe(scrollY);
  });

  it("uses native Renderable teardown", async () => {
    const textarea = await createTextarea({ initialValue: "cleanup" });

    textarea.destroy();

    expect(textarea.isDestroyed).toBe(true);
    expect(textarea.parent).toBeNull();
    expect(() => {
      textarea.disabled = true;
    }).not.toThrow();
  });
});
