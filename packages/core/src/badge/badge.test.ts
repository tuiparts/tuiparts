import { afterEach, describe, expect, it } from "bun:test";
import { Renderable, type RGBA } from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererSetup,
} from "@opentui/core/testing";
import { BadgeRenderable } from "./badge";

let setup: TestRendererSetup | undefined;

afterEach(() => {
  setup?.renderer.destroy();
  setup = undefined;
});

function renderedSpans() {
  return setup?.captureSpans().lines.flatMap((line) => line.spans) ?? [];
}

function colorInts(color: RGBA): [number, number, number, number] {
  return color.toInts();
}

describe("BadgeRenderable", () => {
  it("layers defaults, root options, and resolved authored styles", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    const badge = new BadgeRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "X",
      styleResolver: () => ({ root: { paddingLeft: 3 }, label: {} }),
      paddingLeft: 2,
    });

    setup.renderer.root.add(badge);
    await setup.renderOnce();
    expect(badge.width).toBe(5);

    badge.styleResolver = undefined;
    await setup.renderOnce();
    expect(badge.width).toBe(4);
  });

  it("uses composed content and padding for Yoga measurement", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    const badge = new BadgeRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "OK",
    });

    setup.renderer.root.add(badge);
    await setup.renderOnce();

    expect(badge.width).toBe(4);
    expect(badge.height).toBe(1);
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 4)).toBe(" OK ");

    badge.label = "READY";
    await setup.renderOnce();

    expect(badge.width).toBe(7);
    expect(setup.captureCharFrame().split("\n")[0]?.slice(0, 7)).toBe(
      " READY ",
    );
  });

  it("applies runtime root and label style updates", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    const badge = new BadgeRenderable(setup.renderer, {
      alignSelf: "flex-start",
      label: "OK",
    });

    setup.renderer.root.add(badge);
    await setup.renderOnce();

    badge.styles = {
      root: { backgroundColor: "#112233", paddingLeft: 2, paddingRight: 2 },
      label: { color: "#AABBCC", backgroundColor: "#445566" },
    };
    await setup.renderOnce();

    expect(badge.width).toBe(6);
    const content = renderedSpans().find((span) => span.text.includes("OK"));
    expect(content).toBeDefined();
    expect(colorInts(content?.fg as RGBA)).toEqual([170, 187, 204, 255]);
    expect(colorInts(content?.bg as RGBA)).toEqual([68, 85, 102, 255]);

    badge.styles = { root: {}, label: { width: 8 } };
    await setup.renderOnce();
    expect(badge.width).toBe(10);

    badge.styles = { root: {}, label: {} };
    await setup.renderOnce();
    expect(badge.width).toBe(4);
    expect(badge.backgroundColor.toInts()).toEqual([0, 0, 0, 0]);

    badge.styles = { root: { left: 5, minWidth: 10 }, label: {} };
    await setup.renderOnce();
    expect(badge.width).toBe(10);
    expect(badge.x).toBe(5);

    badge.styles = { root: { maxWidth: 1 }, label: {} };
    await setup.renderOnce();
    expect(badge.width).toBe(2);
    expect(badge.x).toBe(0);

    badge.styles = { root: {}, label: {} };
    await setup.renderOnce();
    expect(badge.width).toBe(4);
  });

  it("resolves styles from the current public state", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    let resolvedState: object | undefined;
    const badge = new BadgeRenderable(setup.renderer, {
      label: "V1",
      styleResolver: (state) => {
        resolvedState = state;
        return {
          root: { paddingLeft: 1, paddingRight: 1 },
          label: { color: "#00FF00" },
        };
      },
    });

    setup.renderer.root.add(badge);
    await setup.renderOnce();

    expect(resolvedState).toEqual({});
    const content = renderedSpans().find((span) => span.text.includes("V1"));
    expect(colorInts(content?.fg as RGBA)).toEqual([0, 255, 0, 255]);
  });

  it("destroys its owned composition children", async () => {
    setup = await createTestRenderer({ width: 20, height: 5 });
    const badge = new BadgeRenderable(setup.renderer, { label: "V1" });
    const label = badge.getChildren()[0];
    setup.renderer.root.add(badge);
    await setup.renderOnce();

    badge.destroy();

    expect(Renderable.renderablesByNumber.has(label?.num ?? -1)).toBe(false);
  });
});
