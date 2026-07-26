import {
  BoxRenderable,
  createCliRenderer,
  TextRenderable,
} from "@opentui/core";
import {
  AccordionItemRenderable,
  AccordionPanelRenderable,
  AccordionRootRenderable,
  type AccordionTriggerState,
  AccordionTriggerRenderable,
} from "../src/accordion";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "Core Accordion Primitive",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Up/Down moves focus. Space/Enter toggles an Item. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "Open: shipping",
  fg: "#60A5FA",
});
const root = new AccordionRootRenderable(renderer, {
  defaultValue: ["shipping"],
  flexDirection: "column",
  onValueChange: (value, details) => {
    status.content = `Open: ${value.join(", ") || "none"} (${details.source})`;
  },
});

function createItem(value: string, labelText: string, content: string) {
  const item = new AccordionItemRenderable(renderer, {
    flexDirection: "column",
    gap: 1,
    store: root.store,
    value,
  });
  const trigger = new AccordionTriggerRenderable(renderer, {
    height: 1,
    item,
    paddingX: 1,
  });
  const label = new TextRenderable(renderer, { content: "" });
  trigger.add(label);
  const sync = (state: AccordionTriggerState) => {
    label.content = `${state.open ? "⌄" : "›"} ${labelText}`;
    label.fg = state.disabled
      ? "#737373"
      : state.focused
        ? "#FFFFFF"
        : "#D4D4D4";
    trigger.backgroundColor = state.focused ? "#262626" : "transparent";
  };
  sync(trigger.getState());
  trigger.subscribe(sync);

  const panel = new AccordionPanelRenderable(renderer, {
    item,
    paddingLeft: 3,
  });
  panel.add(new TextRenderable(renderer, { content, fg: "#A3A3A3" }));
  item.add(trigger);
  item.add(panel);
  root.add(item);
  return trigger;
}

const firstTrigger = createItem(
  "shipping",
  "How long does shipping take?",
  "Most orders arrive within three business days.",
);
createItem(
  "returns",
  "Can I return an order?",
  "Unused items can be returned within 30 days.",
);
createItem(
  "support",
  "How do I contact support?",
  "Send a message from the account screen.",
);

screen.add(root);
screen.add(status);
renderer.root.add(screen);
firstTrigger.focus();
