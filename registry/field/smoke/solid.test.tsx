/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "./components/ui/field";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("installed Solid Field recipe", () => {
  it("renders field hierarchy", async () => {
    setup = await testRender(
      () => (
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel required>Username</FieldLabel>
              <FieldDescription>Choose a unique handle.</FieldDescription>
              <FieldError content="Username already taken" />
            </Field>
          </FieldGroup>
        </FieldSet>
      ),
      { width: 40, height: 10 },
    );
    await setup.renderOnce();

    const output = setup.captureCharFrame();
    expect(output).toContain("Username *");
    expect(output).toContain("Choose a unique handle.");
    expect(output).toContain("Username already taken");
  });
});
