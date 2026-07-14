import { describe, expect, test } from "bun:test";
import { RGBA } from "@opentui/core";
import { assignStyleProps, type StyleProps } from "./assign";

class TextTarget {
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

class LayoutTarget {
  assignments = 0;
  private _paddingLeft = 0;

  get paddingLeft(): number {
    return this._paddingLeft;
  }

  set paddingLeft(value: number) {
    this._paddingLeft = value;
    this.assignments++;
  }
}

describe("assignStyleProps", () => {
  test("normalizes public color names and skips redundant assignments", () => {
    const target = new TextTarget();

    assignStyleProps(target, {
      color: "#FFFFFF",
      backgroundColor: "#000000",
    });
    assignStyleProps(target, {
      color: "#FFFFFF",
      backgroundColor: "#000000",
    });

    expect(target.assignments).toBe(2);
  });

  test("restores the native value when a recipe stops assigning a property", () => {
    const target = new LayoutTarget();

    assignStyleProps(target, { paddingLeft: 3 });
    assignStyleProps(target, {});

    expect(target.paddingLeft).toBe(0);
    expect(target.assignments).toBe(2);
  });

  test("snapshots mutable color values", () => {
    const target = new TextTarget();
    const color = RGBA.fromInts(255, 0, 0, 255);

    assignStyleProps(target, { color });
    color.r = 0;
    color.g = 1;
    assignStyleProps(target, { color });

    expect((target.fg as RGBA).toInts()).toEqual([0, 255, 0, 255]);
    expect(target.assignments).toBe(2);
  });
});

const presentationOnly: StyleProps<{
  color?: string;
  disabled?: boolean;
  onPress?: () => void;
}> = {
  color: "white",
  // @ts-expect-error behavior props are not recipe style properties
  disabled: true,
};
void presentationOnly;
