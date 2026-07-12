import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { InputPrimitiveRenderable } from "./primitive";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

async function createInput(
  options: ConstructorParameters<typeof InputPrimitiveRenderable>[1] = {},
): Promise<InputPrimitiveRenderable> {
  setup = await createTestRenderer({ width: 30, height: 5 });
  const input = new InputPrimitiveRenderable(setup.renderer, options);
  setup.renderer.root.add(input);
  return input;
}

describe("InputPrimitiveRenderable", () => {
  it("uses value for initialization without emitting callbacks", async () => {
    const events: string[] = [];
    const input = await createInput({
      value: "Initial",
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });

    expect(input.value).toBe("Initial");
    expect(events).toEqual([]);
  });

  it("preserves programmatic value setter behavior", async () => {
    const events: string[] = [];
    const input = await createInput({
      value: "Before",
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });

    input.value = "After";

    expect(input.value).toBe("After");
    expect(events).toEqual(["input:After"]);
  });

  it("lets user edits mutate directly and reports upstream event order", async () => {
    const events: string[] = [];
    const input = await createInput({
      value: "A",
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });
    input.focus();

    await setup?.mockInput.typeText("B");
    setup?.mockInput.pressEnter();

    expect(input.value).toBe("AB");
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB"]);

    setup?.mockInput.pressEnter();
    expect(events).toEqual(["input:AB", "change:AB", "submit:AB", "submit:AB"]);
  });

  it("reports a changed blur as change without submit", async () => {
    const events: string[] = [];
    const input = await createInput({
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });
    input.focus();

    await setup?.mockInput.typeText("A");
    input.blur();

    expect(events).toEqual(["input:A", "change:A"]);
  });

  it("blocks focus, keyboard editing, and submit while disabled", async () => {
    const events: string[] = [];
    const input = await createInput({
      disabled: true,
      value: "Fixed",
      onInput: (value) => events.push(`input:${value}`),
      onChange: (value) => events.push(`change:${value}`),
      onSubmit: (value) => events.push(`submit:${value}`),
    });

    input.focus();
    await setup?.mockInput.typeText("X");

    expect(input.focused).toBe(false);
    expect(input.value).toBe("Fixed");
    expect(input.submit()).toBe(false);
    expect(events).toEqual([]);
  });
});
