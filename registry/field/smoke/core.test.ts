import { afterEach, describe, expect, it } from "bun:test";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import {
  createField,
  createFieldDescription,
  createFieldError,
  createFieldGroup,
  createFieldLabel,
  createFieldSet,
} from "./components/ui/field";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Core Field recipe", () => {
  it("renders field elements with label, description, and error", async () => {
    setup = await createTestRenderer({ width: 40, height: 10 });
    const set = createFieldSet(setup.renderer);
    const group = createFieldGroup(setup.renderer);
    const field = createField(setup.renderer);

    const label = createFieldLabel(setup.renderer, {
      content: "Email",
      required: true,
    });
    const description = createFieldDescription(setup.renderer, {
      content: "Enter your work address.",
    });
    const error = createFieldError(setup.renderer, {
      errors: [{ message: "Email is required" }],
    });

    field.add(label);
    field.add(description);
    field.add(error);
    group.add(field);
    set.add(group);
    setup.renderer.root.add(set);
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("Email *");
    expect(output).toContain("Enter your work address.");
    expect(output).toContain("Email is required");
  });
});
