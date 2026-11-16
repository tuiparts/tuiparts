/** @jsxImportSource @opentui/react */

import { afterEach, expect, test } from "bun:test";
import type { BoxRenderable } from "@opentui/core";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import { act } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./components/ui/input-otp";
import { theme } from "./components/ui/theme";

let setup: TestRendererSetup | undefined;

afterEach(async () => {
  await act(async () => setup?.renderer.destroy());
  setup = undefined;
});

test("installed React InputOTP recipe renders slots and separators", async () => {
  setup = await testRender(
    <InputOTP id="otp" maxLength={4} defaultValue="12">
      <InputOTPGroup>
        <InputOTPSlot id="slot-0" index={0} />
        <InputOTPSlot id="slot-1" index={1} />
      </InputOTPGroup>
      <InputOTPSeparator id="sep" />
      <InputOTPGroup>
        <InputOTPSlot id="slot-2" index={2} />
        <InputOTPSlot id="slot-3" index={3} />
      </InputOTPGroup>
    </InputOTP>,
    { width: 30, height: 5 },
  );
  await setup.renderOnce();

  const otp = setup.renderer.root.findDescendantById("otp") as BoxRenderable;
  expect(otp).toBeDefined();
  const slot0 = setup.renderer.root.findDescendantById(
    "slot-0",
  ) as BoxRenderable;
  expect(slot0).toBeDefined();
});

test("restyles on theme switch", async () => {
  theme.register("smoke", {
    tokens: {
      colors: {
        border: "#123456",
        primary: "#654321",
        foreground: "#FEDCBA",
      },
    },
  });
  setup = await testRender(
    <InputOTP maxLength={2}>
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
    </InputOTP>,
    { width: 30, height: 5 },
  );
  await act(async () => {
    theme.setActive("smoke");
  });
  await act(async () => {
    theme.setActive("terminal");
  });
});
