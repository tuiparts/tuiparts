import {
  BoxRenderable,
  createCliRenderer,
  TextRenderable,
} from "@opentui/core";
import {
  CheckboxIndicatorRenderable,
  CheckboxRootRenderable,
  type CheckboxState,
} from "../src/checkbox";
import { CheckboxGroupRenderable } from "../src/checkbox-group";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "Core CheckboxGroup Primitive",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Up/Down moves focus. Space/Enter toggles. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "Checked: email",
  fg: "#60A5FA",
});
const group = new CheckboxGroupRenderable(renderer, {
  defaultValue: ["email"],
  flexDirection: "column",
  onValueChange: (value, details) => {
    status.content =
      `Checked: ${value.join(", ") || "none"} (${details.source})`;
  },
});

function createItem(value: string, labelText: string) {
  const item = new CheckboxRootRenderable(renderer, {
    flexDirection: "row",
    gap: 1,
    group: group.store,
    height: 1,
    paddingX: 1,
    value,
  });
  const markCell = new BoxRenderable(renderer, { width: 1 });
  const indicator = new CheckboxIndicatorRenderable(renderer, {
    store: item.store,
  });
  indicator.add(
    new TextRenderable(renderer, { content: "✓", fg: "#60A5FA" }),
  );
  markCell.add(indicator);
  const label = new TextRenderable(renderer, { content: labelText });
  item.add(markCell);
  item.add(label);
  const sync = (state: CheckboxState) => {
    item.backgroundColor = state.focused ? "#262626" : "transparent";
    label.fg = state.focused ? "#FFFFFF" : "#D4D4D4";
  };
  sync(item.getState());
  item.subscribe(sync);
  group.add(item);
  return item;
}

const first = createItem("email", "Email notifications");
createItem("sms", "SMS notifications");
createItem("product", "Product announcements");

screen.add(group);
screen.add(status);
renderer.root.add(screen);
first.focus();
