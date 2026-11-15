/** @jsxImportSource @opentui/solid */

import { afterEach, describe, expect, it } from "bun:test";
import type { TestRendererSetup } from "@opentui/core/testing";
import { testRender } from "@opentui/solid";
import {
  ProgressIndicatorRenderable,
  ProgressRootRenderable,
} from "@tuiparts/core/progress";
import { createSignal } from "solid-js";
import { Progress } from "./index";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

describe("Solid Progress", () => {
  it("renders Root and Indicator with shared store and computes width", async () => {
    let root!: ProgressRootRenderable;
    let indicator!: ProgressIndicatorRenderable;

    setup = await testRender(
      () => (
        <Progress.Root
          defaultValue={50}
          id="root"
          width={40}
          ref={(el) => (root = el)}
        >
          <Progress.Indicator id="indicator" ref={(el) => (indicator = el)} />
        </Progress.Root>
      ),
      { width: 40, height: 3 },
    );
    await setup.renderOnce();

    expect(root).toBeInstanceOf(ProgressRootRenderable);
    expect(indicator).toBeInstanceOf(ProgressIndicatorRenderable);
    expect(indicator.width).toBe(20);
    expect(indicator.percentage).toBe(50);
  });

  it("updates indicator reactively when controlled value changes", async () => {
    const [value, setValue] = createSignal(25);
    let indicator!: ProgressIndicatorRenderable;

    setup = await testRender(
      () => (
        <Progress.Root id="root" value={value()} width={40}>
          <Progress.Indicator id="indicator" ref={(el) => (indicator = el)} />
        </Progress.Root>
      ),
      { width: 40, height: 3 },
    );
    await setup.renderOnce();

    expect(indicator.width).toBe(10);

    setValue(75);
    await setup.renderOnce();
    expect(indicator.width).toBe(30);
  });

  it("rejects orphan Indicator outside Root", async () => {
    await expect(
      testRender(() => <Progress.Indicator />, { width: 10, height: 2 }),
    ).rejects.toThrow(
      "Progress.Indicator must be rendered inside Progress.Root",
    );
  });
});
