/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "./components/ui/field";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React Field recipe renders field hierarchy", async () => {
  setup = await testRender(
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel required>Username</FieldLabel>
          <FieldDescription>Choose a unique handle.</FieldDescription>
          <FieldError content="Username already taken" />
        </Field>
      </FieldGroup>
    </FieldSet>,
    { width: 40, height: 10 },
  );
  await setup.renderOnce();

  const output = setup.captureCharFrame();
  expect(output).toContain("Username *");
  expect(output).toContain("Choose a unique handle.");
  expect(output).toContain("Username already taken");
});
