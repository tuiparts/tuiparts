import { describe, expect, it } from "bun:test";
import { RGBA, TextRenderable } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { applySlotProps } from "./styled-renderable";

class InstrumentedTextTarget {
  assignments = 0;
  private _fg: unknown;
  private _bg: unknown;

  get fg(): unknown {
    return this._fg;
  }

  set fg(value: unknown) {
    this._fg = value;
    this.assignments++;
  }

  get bg(): unknown {
    return this._bg;
  }

  set bg(value: unknown) {
    this._bg = value;
    this.assignments++;
  }
}

class WriteOnlyTarget {
  assignments = 0;

  set paddingLeft(_value: unknown) {
    this.assignments++;
  }
}

class ObjectTarget {
  assignments = 0;
  private _customBorderChars: object | undefined;

  get customBorderChars(): object | undefined {
    return this._customBorderChars;
  }

  set customBorderChars(value: object | undefined) {
    this._customBorderChars = value;
    this.assignments++;
  }
}

class LayeredTarget {
  private _paddingLeft = 0;

  get paddingLeft(): number {
    return this._paddingLeft;
  }

  set paddingLeft(value: number) {
    this._paddingLeft = value;
  }
}

describe("applySlotProps", () => {
  it("layers defaults, a live baseline, and authored styles", () => {
    const target = new LayeredTarget();
    const defaults = { paddingLeft: 1 };

    applySlotProps(target, { paddingLeft: 3 }, { paddingLeft: 2 }, defaults);
    expect(target.paddingLeft).toBe(3);

    applySlotProps(target, { paddingLeft: 3 }, { paddingLeft: 4 }, defaults);
    expect(target.paddingLeft).toBe(3);

    applySlotProps(target, {}, { paddingLeft: 4 }, defaults);
    expect(target.paddingLeft).toBe(4);

    applySlotProps(target, {}, {}, defaults);
    expect(target.paddingLeft).toBe(1);

    applySlotProps(target, {}, {}, {});
    expect(target.paddingLeft).toBe(0);
  });

  it("preserves layered fallthrough for setter-only properties", () => {
    const target = new WriteOnlyTarget();

    applySlotProps(target, { paddingLeft: 3 }, { paddingLeft: 2 }, {
      paddingLeft: 1,
    });
    applySlotProps(target, { paddingLeft: 3 }, { paddingLeft: 4 }, {
      paddingLeft: 1,
    });
    applySlotProps(target, {}, { paddingLeft: 4 }, { paddingLeft: 1 });
    applySlotProps(target, {}, {}, { paddingLeft: 1 });
    applySlotProps(target, {}, {}, {});

    expect(target.assignments).toBe(5);
  });

  it("snapshots mutable RGBA values in every layer", () => {
    const target = new InstrumentedTextTarget();
    const baseline = RGBA.fromInts(20, 30, 40, 255);
    const defaults = RGBA.fromInts(10, 15, 20, 255);
    const authored = RGBA.fromInts(30, 45, 60, 255);

    applySlotProps(target, { color: authored }, { color: baseline }, {
      color: defaults,
    });
    baseline.r = 100 / 255;
    defaults.g = 100 / 255;
    applySlotProps(target, {}, { color: baseline }, { color: defaults });

    expect((target.fg as RGBA).toInts()).toEqual([100, 30, 40, 255]);
    expect(target.assignments).toBe(2);
  });

  it("does not reassign unchanged normalized properties", () => {
    const target = new InstrumentedTextTarget();

    applySlotProps(target, {
      color: "#FFFFFF",
      backgroundColor: "#000000",
    });
    expect(target.assignments).toBe(2);

    applySlotProps(target, {
      color: "#FFFFFF",
      backgroundColor: "#000000",
    });
    expect(target.assignments).toBe(2);

    applySlotProps(target, {
      color: "#22C55E",
      backgroundColor: "#000000",
    });
    expect(target.assignments).toBe(3);
  });

  it("reapplies a mutable RGBA after its value changes", async () => {
    const setup = await createTestRenderer({ width: 10, height: 2 });
    const text = new TextRenderable(setup.renderer, { content: "X" });
    const color = RGBA.fromInts(255, 0, 0, 255);
    setup.renderer.root.add(text);

    applySlotProps(text, { color });
    await setup.renderOnce();
    expect(setup.captureSpans().lines[0]?.spans[0]?.fg.toInts()).toEqual([
      255, 0, 0, 255,
    ]);

    color.r = 0;
    color.g = 255;
    applySlotProps(text, { color });
    await setup.renderOnce();
    expect(setup.captureSpans().lines[0]?.spans[0]?.fg.toInts()).toEqual([
      0, 255, 0, 255,
    ]);

    setup.renderer.destroy();
  });

  it("reasserts a readable styled property after an external write", () => {
    const target = new InstrumentedTextTarget();
    const styles = { color: "#FFFFFF", backgroundColor: "#000000" };

    applySlotProps(target, styles);
    target.fg = "#22C55E";
    const assignmentsAfterExternalWrite = target.assignments;

    applySlotProps(target, styles);

    expect(target.fg).toBe("#FFFFFF");
    expect(target.assignments).toBe(assignmentsAfterExternalWrite + 1);
  });

  it("snapshots mutable RGBA baseline values", () => {
    const target = new InstrumentedTextTarget();
    const baseline = RGBA.fromInts(255, 255, 255, 255);

    applySlotProps(target, { color: "#FF0000" }, { color: baseline });
    baseline.r = 0;
    baseline.g = 0;
    baseline.b = 0;
    applySlotProps(target, {});

    expect((target.fg as RGBA).toInts()).toEqual([255, 255, 255, 255]);
  });

  it("reapplies setter-only properties because target drift is unreadable", () => {
    const target = new WriteOnlyTarget();

    applySlotProps(target, { paddingLeft: 1 });
    applySlotProps(target, { paddingLeft: 1 });

    expect(target.assignments).toBe(2);
  });

  it("reapplies mutable object properties even when identity is unchanged", () => {
    const target = new ObjectTarget();
    const customBorderChars = { horizontal: "-" };

    applySlotProps(target, { customBorderChars });
    customBorderChars.horizontal = "=";
    applySlotProps(target, { customBorderChars });

    expect(target.assignments).toBe(2);
    expect(target.customBorderChars).toEqual({ horizontal: "=" });
  });
});
