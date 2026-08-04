import {
  BoxRenderable,
  createCliRenderer,
  TextRenderable,
} from "@opentui/core";
import {
  SliderRangeRenderable,
  SliderRootRenderable,
  type SliderState,
  SliderThumbRenderable,
  SliderTrackRenderable,
} from "../src/slider";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "Core Slider Primitive",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Click or drag Track. Left/Right step. Home/End and Page keys jump. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "Value: 25",
  fg: "#60A5FA",
});
const root = new SliderRootRenderable(renderer, {
  defaultValue: 25,
  largeStep: 20,
  max: 100,
  min: 0,
  onValueCommit: (value, details) => {
    status.content = `Committed: ${value} (${details.reason})`;
  },
  step: 5,
});
const track = new SliderTrackRenderable(renderer, {
  height: 1,
  position: "relative",
  store: root.store,
  width: 32,
});
const trackText = new TextRenderable(renderer, {
  content: "─".repeat(32),
  fg: "#525252",
  position: "absolute",
});
const range = new SliderRangeRenderable(renderer, {
  height: 1,
  position: "absolute",
  store: root.store,
});
const rangeText = new TextRenderable(renderer, {
  content: "",
  fg: "#60A5FA",
});
const thumb = new SliderThumbRenderable(renderer, {
  height: 1,
  position: "absolute",
  store: root.store,
  width: 1,
});
const thumbText = new TextRenderable(renderer, {
  content: "●",
  fg: "#FFFFFF",
});
range.add(rangeText);
thumb.add(thumbText);
track.add(trackText);
track.add(range);
track.add(thumb);
root.add(track);

const sync = (state: SliderState) => {
  const ratio =
    state.max === state.min
      ? 0
      : (state.value - state.min) / (state.max - state.min);
  const offset = Math.round(ratio * 31);
  range.width = offset + 1;
  rangeText.content = "━".repeat(offset + 1);
  thumb.left = offset;
  thumbText.fg = state.focused ? "#FFFFFF" : "#A3A3A3";
  if (!state.dragging) status.content = `Value: ${state.value}`;
};
sync(root.getState());
root.store.subscribe(sync);

screen.add(root);
screen.add(status);
renderer.root.add(screen);
track.focus();
