import { type RGBA, type TextOptions, TextRenderable } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { applySlotProps } from "../src/styled-renderable";

const ITERATIONS = 100_000;
const REAL_ITERATIONS = 10_000;
const SAMPLES = 9;

interface InstrumentedTarget {
  assignments: number;
  renderRequests: number;
  checksum: number;
}

class TextTarget implements InstrumentedTarget {
  assignments = 0;
  renderRequests = 0;
  checksum = 0;
  private _fg: unknown;
  private _bg: unknown;
  private _paddingLeft: unknown;
  private _paddingRight: unknown;
  private _opacity: unknown;

  get fg(): unknown {
    return this._fg;
  }

  set fg(value: unknown) {
    this._fg = value;
    this.changed(value);
  }

  get bg(): unknown {
    return this._bg;
  }

  set bg(value: unknown) {
    this._bg = value;
    this.changed(value);
  }

  get paddingLeft(): unknown {
    return this._paddingLeft;
  }

  set paddingLeft(value: unknown) {
    this._paddingLeft = value;
    this.changed(value);
  }

  get paddingRight(): unknown {
    return this._paddingRight;
  }

  set paddingRight(value: unknown) {
    this._paddingRight = value;
    this.changed(value);
  }

  get opacity(): unknown {
    return this._opacity;
  }

  set opacity(value: unknown) {
    this._opacity = value;
    this.changed(value);
  }

  private changed(value: unknown): void {
    this.assignments++;
    this.renderRequests++;
    this.checksum += typeof value === "number" ? value : String(value).length;
  }
}

class InputTarget implements InstrumentedTarget {
  assignments = 0;
  renderRequests = 0;
  checksum = 0;
  private _textColor: unknown;
  private _backgroundColor: unknown;
  private _selectionFg: unknown;
  private _selectionBg: unknown;
  private _cursorColor: unknown;

  get textColor(): unknown {
    return this._textColor;
  }

  set textColor(value: unknown) {
    this._textColor = value;
    this.changed(value);
  }

  get backgroundColor(): unknown {
    return this._backgroundColor;
  }

  set backgroundColor(value: unknown) {
    this._backgroundColor = value;
    this.changed(value);
  }

  get selectionFg(): unknown {
    return this._selectionFg;
  }

  set selectionFg(value: unknown) {
    this._selectionFg = value;
    this.changed(value);
  }

  get selectionBg(): unknown {
    return this._selectionBg;
  }

  set selectionBg(value: unknown) {
    this._selectionBg = value;
    this.changed(value);
  }

  get cursorColor(): unknown {
    return this._cursorColor;
  }

  set cursorColor(value: unknown) {
    this._cursorColor = value;
    this.changed(value);
  }

  private changed(value: unknown): void {
    this.assignments++;
    this.renderRequests++;
    this.checksum += String(value).length;
  }
}

interface Result {
  scenario: string;
  iterations: number;
  medianMs: number;
  operationsPerSecond: number;
  assignments: number;
  renderRequests: number;
  checksum: number;
}

class InstrumentedTextRenderable extends TextRenderable {
  assignments = 0;

  override get fg(): RGBA {
    return super.fg;
  }

  override set fg(value: TextOptions["fg"]) {
    this.assignments++;
    super.fg = value;
  }

  override get bg(): RGBA {
    return super.bg;
  }

  override set bg(value: TextOptions["bg"]) {
    this.assignments++;
    super.bg = value;
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function measure<T extends InstrumentedTarget>(
  scenario: string,
  createTarget: () => T,
  apply: (target: T, iteration: number) => void,
): Result {
  const samples: number[] = [];
  let lastTarget = createTarget();

  for (let sample = -2; sample < SAMPLES; sample++) {
    const target = createTarget();
    const start = performance.now();
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      apply(target, iteration);
    }
    const duration = performance.now() - start;
    if (sample >= 0) samples.push(duration);
    lastTarget = target;
  }

  const medianMs = median(samples);
  return {
    scenario,
    iterations: ITERATIONS,
    medianMs: Number(medianMs.toFixed(3)),
    operationsPerSecond: Math.round(ITERATIONS / (medianMs / 1000)),
    assignments: lastTarget.assignments,
    renderRequests: lastTarget.renderRequests,
    checksum: lastTarget.checksum,
  };
}

async function measureRealText(): Promise<Result> {
  const setup = await createTestRenderer({ width: 20, height: 5 });
  const originalRequestRender = setup.renderer.requestRender.bind(
    setup.renderer,
  );
  let renderRequests = 0;
  setup.renderer.requestRender = () => {
    renderRequests++;
    originalRequestRender();
  };

  const samples: number[] = [];
  let assignments = 0;
  let measuredRenderRequests = 0;
  for (let sample = -2; sample < SAMPLES; sample++) {
    const target = new InstrumentedTextRenderable(setup.renderer, {
      content: "benchmark",
    });
    renderRequests = 0;
    const start = performance.now();
    for (let iteration = 0; iteration < REAL_ITERATIONS; iteration++) {
      applySlotProps(target, textStyles);
    }
    const duration = performance.now() - start;
    if (sample >= 0) samples.push(duration);
    assignments = target.assignments;
    measuredRenderRequests = renderRequests;
    target.destroy();
  }
  setup.renderer.destroy();

  const medianMs = median(samples);
  return {
    scenario: "real-opentui-unchanged-text",
    iterations: REAL_ITERATIONS,
    medianMs: Number(medianMs.toFixed(3)),
    operationsPerSecond: Math.round(REAL_ITERATIONS / (medianMs / 1000)),
    assignments,
    renderRequests: measuredRenderRequests,
    checksum: 0,
  };
}

const textStyles = {
  color: "#E5E5E5",
  backgroundColor: "#171717",
  opacity: 0.8,
  paddingX: 1,
};
const inputStyles = {
  color: "#E5E5E5",
  backgroundColor: "#171717",
  cursorColor: "#FFFFFF",
  selectionColor: "#000000",
  selectionBackgroundColor: "#FFFFFF",
};

const results = [
  measure(
    "unchanged-text",
    () => new TextTarget(),
    (target) => {
      applySlotProps(target, textStyles);
    },
  ),
  measure(
    "one-changing-text-color",
    () => new TextTarget(),
    (target, index) => {
      applySlotProps(target, {
        ...textStyles,
        color: index % 2 === 0 ? "#E5E5E5" : "#22C55E",
      });
    },
  ),
  measure(
    "unchanged-input",
    () => new InputTarget(),
    (target) => {
      applySlotProps(target, inputStyles);
    },
  ),
  await measureRealText(),
];

console.log(
  JSON.stringify(
    {
      runtime: `Bun ${Bun.version}`,
      platform: `${process.platform}-${process.arch}`,
      samples: SAMPLES,
      results,
    },
    null,
    2,
  ),
);
