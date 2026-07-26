import {
  BoxRenderable,
  createCliRenderer,
  TextRenderable,
} from "@opentui/core";
import {
  CollapsiblePanelRenderable,
  CollapsibleRootRenderable,
  CollapsibleTriggerRenderable,
  type CollapsibleTriggerState,
} from "../src/collapsible";

const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setBackgroundColor("#0A0A0A");

const screen = new BoxRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  padding: 2,
});
screen.add(
  new TextRenderable(renderer, {
    content: "Core Collapsible Primitive",
    fg: "#FFFFFF",
  }),
);
screen.add(
  new TextRenderable(renderer, {
    content: "Space/Enter toggles the focused Trigger. Ctrl+C quits.",
    fg: "#737373",
  }),
);

const status = new TextRenderable(renderer, {
  content: "State: closed (ready)",
  fg: "#60A5FA",
});
const root = new CollapsibleRootRenderable(renderer, {
  flexDirection: "column",
  gap: 1,
  onOpenChange: (open, details) => {
    status.content = `State: ${open ? "open" : "closed"} (${details.source})`;
  },
});
const trigger = new CollapsibleTriggerRenderable(renderer, {
  height: 1,
  paddingX: 1,
  store: root.store,
});
const label = new TextRenderable(renderer, { content: "" });
trigger.add(label);

const syncTrigger = (state: CollapsibleTriggerState) => {
  label.content = `${state.open ? "⌄" : "›"} Connection details`;
  label.fg = state.disabled ? "#737373" : state.focused ? "#FFFFFF" : "#D4D4D4";
  trigger.backgroundColor = state.focused ? "#262626" : "transparent";
};
syncTrigger(trigger.getState());
trigger.subscribe(syncTrigger);

const panel = new CollapsiblePanelRenderable(renderer, {
  paddingLeft: 3,
  store: root.store,
});
panel.add(
  new TextRenderable(renderer, {
    content: "Region: eu-west\nTransport: ssh",
    fg: "#A3A3A3",
  }),
);

root.add(trigger);
root.add(panel);
screen.add(root);
screen.add(status);
renderer.root.add(screen);
trigger.focus();
