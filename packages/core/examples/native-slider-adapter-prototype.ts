import {
  createCliRenderer,
  type KeyEvent,
  RGBA,
  type RenderContext,
  SliderRenderable,
  TextRenderable,
  BoxRenderable,
} from "@opentui/core";

const TRACK_WIDTH = 32;
const MIN = -1;
const MAX = 1;
const STEP = 0.25;

function clamp(value: number): number {
  return Math.max(MIN, Math.min(MAX, value));
}

function snap(value: number): number {
  return clamp(Math.round(value / STEP) * STEP);
}

function toNative(value: number): number {
  return ((clamp(value) - MIN) / (MAX - MIN)) * 100;
}

function fromNative(value: number): number {
  return MIN + (value / 100) * (MAX - MIN);
}

class NativeSliderAdapterPrototype extends SliderRenderable {
  readonly track: TextRenderable;
  readonly range: TextRenderable;
  readonly thumb: TextRenderable;

  private domainValue: number;
  private syncingNativeValue = false;
  private readonly onDomainChange: (value: number, source: "keyboard" | "pointer") => void;

  constructor(
    ctx: RenderContext,
    options: {
      readonly defaultValue: number;
      readonly onDomainChange: (value: number, source: "keyboard" | "pointer") => void;
    },
  ) {
    let receiveNativeChange = (_value: number) => {};
    const transparent = RGBA.fromInts(0, 0, 0, 0);

    super(ctx, {
      backgroundColor: transparent,
      foregroundColor: transparent,
      height: 1,
      max: 100,
      min: 0,
      onChange: (value) => receiveNativeChange(value),
      orientation: "horizontal",
      value: toNative(options.defaultValue),
      viewPortSize: 0.01,
      width: TRACK_WIDTH,
    });

    this.domainValue = snap(options.defaultValue);
    this.onDomainChange = options.onDomainChange;
    this.focusable = true;
    this.onMouse = (event) => {
      if (event.type === "down") this.focus();
    };

    this.track = new TextRenderable(ctx, {
      content: "─".repeat(TRACK_WIDTH),
      fg: "#525252",
      height: 1,
      left: 0,
      position: "absolute",
      top: 0,
    });
    this.range = new TextRenderable(ctx, {
      content: "",
      fg: "#60A5FA",
      height: 1,
      left: 0,
      position: "absolute",
      top: 0,
    });
    this.thumb = new TextRenderable(ctx, {
      content: "●",
      fg: "#FFFFFF",
      height: 1,
      left: 0,
      position: "absolute",
      top: 0,
    });
    this.add(this.track);
    this.add(this.range);
    this.add(this.thumb);
    this.syncParts();

    receiveNativeChange = (value) => {
      if (this.syncingNativeValue) return;
      this.setDomainValue(fromNative(value), "pointer", true);
    };

  }

  get currentValue(): number {
    return this.domainValue;
  }

  setExternalValue(value: number): void {
    this.setDomainValue(value, "keyboard", false);
  }

  override handleKeyPress(key: KeyEvent): boolean {
    if (key.name === "left" || key.name === "down") {
      this.setDomainValue(this.domainValue - STEP, "keyboard", true);
      return true;
    }
    if (key.name === "right" || key.name === "up") {
      this.setDomainValue(this.domainValue + STEP, "keyboard", true);
      return true;
    }
    if (key.name === "home") {
      this.setDomainValue(MIN, "keyboard", true);
      return true;
    }
    if (key.name === "end") {
      this.setDomainValue(MAX, "keyboard", true);
      return true;
    }
    return false;
  }

  private setDomainValue(
    requestedValue: number,
    source: "keyboard" | "pointer",
    notify: boolean,
  ): void {
    const next = snap(requestedValue);
    const changed = next !== this.domainValue;
    this.domainValue = next;

    const nativeValue = toNative(next);
    if (nativeValue !== this.value) {
      this.syncingNativeValue = true;
      this.value = nativeValue;
      this.syncingNativeValue = false;
    }

    this.syncParts();
    if (changed && notify) this.onDomainChange(next, source);
  }

  private syncParts(): void {
    const ratio = (this.domainValue - MIN) / (MAX - MIN);
    const thumbLeft = Math.round(ratio * (TRACK_WIDTH - 1));
    this.range.content = "━".repeat(thumbLeft);
    this.thumb.left = thumbLeft;
    this.thumb.fg = this.focused ? "#FFFFFF" : "#A3A3A3";
  }
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "PROTOTYPE — native Slider as a hidden pointer engine",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Click or drag. Use arrows/Home/End after clicking. R applies an external value. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "Value: -0.5; semantic changes: 0",
  fg: "#60A5FA",
});
let semanticChanges = 0;
const slider = new NativeSliderAdapterPrototype(renderer, {
  defaultValue: -0.5,
  onDomainChange: (value, source) => {
    semanticChanges += 1;
    status.content = `Value: ${value}; source: ${source}; semantic changes: ${semanticChanges}; native value: ${slider.value.toFixed(3)}`;
  },
});

screen.add(slider);
screen.add(status);
screen.add(
  new TextRenderable(renderer, {
    content: "Adapter owns snapping, callbacks, keyboard, focus, visuals, and three child nodes.",
    fg: "#A3A3A3",
  }),
);
renderer.root.add(screen);

renderer.keyInput.on("keypress", (key: KeyEvent) => {
  if (key.name.toLowerCase() === "r") {
    slider.setExternalValue(-0.75);
    status.content = `External value: ${slider.currentValue}; semantic changes: ${semanticChanges}; native value: ${slider.value.toFixed(3)}`;
  }
});
