import {
  BoxRenderable,
  createCliRenderer,
  type KeyEvent,
  SliderRenderable,
  TextRenderable,
} from "@opentui/core";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});

screen.add(
  new TextRenderable(renderer, {
    content: "PROTOTYPE — native OpenTUI Slider viability",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Click or drag either track. Try arrows, Home, and End. R assigns value=0. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "No changes yet.",
  fg: "#60A5FA",
});
const keyboardStatus = new TextRenderable(renderer, {
  content: "Last key: none",
  fg: "#A3A3A3",
});

let changeCount = 0;
let assignmentPending = false;

const reportChange = (source: string, value: number) => {
  changeCount += 1;
  const quarterStepAligned = Math.abs(value * 4 - Math.round(value * 4)) < 1e-9;
  status.content = `${source}: ${value.toFixed(6)}; step 0.25 aligned: ${quarterStepAligned}; callbacks: ${changeCount}`;
};

const defaultThumb = new SliderRenderable(renderer, {
  backgroundColor: "#262626",
  foregroundColor: "#60A5FA",
  height: 1,
  max: 1,
  min: -1,
  onChange: (value) => {
    reportChange(
      assignmentPending ? "programmatic assignment callback" : "default thumb pointer callback",
      value,
    );
    assignmentPending = false;
  },
  orientation: "horizontal",
  value: -0.5,
  viewPortSize: 0.2,
  width: 32,
});

const minimalThumb = new SliderRenderable(renderer, {
  backgroundColor: "#262626",
  foregroundColor: "#F59E0B",
  height: 1,
  max: 1,
  min: -1,
  onChange: (value) => reportChange("minimal thumb pointer callback", value),
  orientation: "horizontal",
  value: -0.5,
  viewPortSize: 0.01,
  width: 32,
});

screen.add(
  new TextRenderable(renderer, {
    content: "viewPortSize=0.2 (scrollbar-style movable thumb)",
    fg: "#D4D4D4",
  }),
);
screen.add(defaultThumb);
screen.add(
  new TextRenderable(renderer, {
    content: "viewPortSize=0.01 (still rendered with an effective minimum of 1)",
    fg: "#D4D4D4",
  }),
);
screen.add(minimalThumb);
screen.add(status);
screen.add(keyboardStatus);
screen.add(
  new TextRenderable(renderer, {
    content: "Public nodes: one SliderRenderable; Track, Range, and Thumb are not addressable.",
    fg: "#737373",
  }),
);

renderer.root.add(screen);

renderer.keyInput.on("keypress", (key: KeyEvent) => {
  const before = defaultThumb.value;
  if (key.name.toLowerCase() === "r") {
    assignmentPending = true;
    defaultThumb.value = 0;
  }
  queueMicrotask(() => {
    keyboardStatus.content = `Last key: ${key.name}; default value before=${before.toFixed(6)} after=${defaultThumb.value.toFixed(6)}`;
  });
});
