import {
  BoxRenderable,
  createCliRenderer,
  TextRenderable,
} from "@opentui/core";
import {
  NumberFieldDecrementRenderable,
  NumberFieldIncrementRenderable,
  NumberFieldInputRenderable,
  NumberFieldRootRenderable,
  NumberFieldScrubAreaRenderable,
  type NumberFieldState,
} from "../src/number-field";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "Core NumberField Primitive",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content:
      "Edit or use Up/Down. Drag the label. Press −/+. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "Value: 2",
  fg: "#60A5FA",
});
const root = new NumberFieldRootRenderable(renderer, {
  defaultValue: 2,
  flexDirection: "column",
  gap: 1,
  max: 20,
  min: 0,
  onValueCommit: (value, details) => {
    status.content = `Committed: ${value ?? "empty"} (${details.reason})`;
  },
  step: 0.5,
});
const scrub = new NumberFieldScrubAreaRenderable(renderer, {
  height: 1,
  paddingX: 1,
  store: root.store,
  width: 24,
});
const scrubLabel = new TextRenderable(renderer, {
  content: "Quantity ↔ drag",
});
scrub.add(scrubLabel);

const row = new BoxRenderable(renderer, { flexDirection: "row" });
const decrement = new NumberFieldDecrementRenderable(renderer, {
  alignItems: "center",
  store: root.store,
  width: 3,
});
decrement.add(new TextRenderable(renderer, { content: "−" }));
const input = new NumberFieldInputRenderable(renderer, {
  backgroundColor: "#171717",
  focusedBackgroundColor: "#262626",
  store: root.store,
  textColor: "#FFFFFF",
  width: 10,
});
const increment = new NumberFieldIncrementRenderable(renderer, {
  alignItems: "center",
  store: root.store,
  width: 3,
});
increment.add(new TextRenderable(renderer, { content: "+" }));
row.add(decrement);
row.add(input);
row.add(increment);
root.add(scrub);
root.add(row);

const sync = (state: NumberFieldState) => {
  scrubLabel.fg = state.scrubbing ? "#60A5FA" : "#D4D4D4";
  if (!state.scrubbing)
    status.content = `Value: ${state.value ?? "empty"}; draft: ${state.inputValue || "empty"}`;
};
sync(root.getState());
root.store.subscribe(sync);

screen.add(root);
screen.add(status);
renderer.root.add(screen);
input.focus();
