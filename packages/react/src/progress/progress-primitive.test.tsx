import { afterEach, describe, expect, it, spyOn } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/react/test-utils";
import {
  ProgressIndicatorRenderable,
  ProgressRootRenderable,
} from "@tuiparts/core/progress";
import { act, createElement, useState } from "react";
import { Progress } from "./index";

let setup: TestRendererSetup | undefined;

async function destroySetup(): Promise<void> {
  if (!setup) return;
  const renderer = setup.renderer;
  setup = undefined;
  const key = "IS_REACT_ACT_ENVIRONMENT";
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, {
    configurable: true,
    get: () => true,
    set: () => {},
  });
  try {
    await act(async () => renderer.destroy());
  } finally {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
}

afterEach(async () => {
  await destroySetup();
});

describe("React Progress", () => {
  it("renders Root and Indicator with shared store and computes width", async () => {
    setup = await testRender(
      createElement(
        Progress.Root,
        { defaultValue: 50, id: "root", width: 40 },
        createElement(Progress.Indicator, { id: "indicator" }),
      ),
      { width: 40, height: 3 },
    );
    await setup.renderOnce();

    const root = setup.renderer.root.findDescendantById("root");
    const indicator = setup.renderer.root.findDescendantById("indicator");
    expect(root).toBeInstanceOf(ProgressRootRenderable);
    expect(indicator).toBeInstanceOf(ProgressIndicatorRenderable);

    if (indicator instanceof ProgressIndicatorRenderable) {
      expect(indicator.width).toBe(20);
      expect(indicator.percentage).toBe(50);
    }
  });

  it("updates indicator reactively when controlled value changes", async () => {
    let updateValue!: (val: number) => void;
    function ControlledProgress() {
      const [value, setValue] = useState(25);
      updateValue = setValue;
      return createElement(
        Progress.Root,
        { id: "root", value, width: 40 },
        createElement(Progress.Indicator, { id: "indicator" }),
      );
    }

    setup = await testRender(createElement(ControlledProgress), {
      width: 40,
      height: 3,
    });
    await setup.renderOnce();

    const indicator = setup.renderer.root.findDescendantById(
      "indicator",
    ) as ProgressIndicatorRenderable;
    expect(indicator.width).toBe(10);

    await act(async () => {
      updateValue(75);
    });
    await setup.renderOnce();
    expect(indicator.width).toBe(30);
  });

  it("throws when Indicator is rendered outside Root", async () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    try {
      setup = await testRender(createElement(Progress.Indicator), {
        width: 10,
        height: 2,
      });
      expect(
        error.mock.calls.some((call) =>
          call.some((value) =>
            String(value).includes(
              "Progress.Indicator must be rendered inside Progress.Root",
            ),
          ),
        ),
      ).toBe(true);
      await destroySetup();
    } finally {
      error.mockRestore();
    }
  });
});
