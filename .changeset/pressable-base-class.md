---
"@tuiparts/core": patch
---

Concentrate activation behavior in one internal Pressable base class
(ADR-0007). Checkbox, Switch, Button, Toggle, Radio, and Dialog Trigger/Close
now share a single interaction contract instead of five drifted copies.

Behavior changes:

- Keyboard activation everywhere is an uncancelled, unmodified Space or Enter
  press. Modifier chords (Ctrl/Meta/Shift/Option/Super/Hyper) and keys with
  `defaultPrevented` no longer activate any Root. Previously Checkbox and
  Switch ignored both guards, Button ignored modifiers, Radio ignored
  cancellation, and Dialog Trigger/Close ignored everything.
- Pointer activation everywhere requires an uncancelled primary-button press
  that starts and ends on the node (Button's model). Previously every
  non-Button Root activated on any primary release over the node, including
  drags that started elsewhere.

Breaking (pre-release):

- `RadioGroupChangeDetails.source` renames `"programmatic"` to
  `"imperative"`, unifying the press vocabulary across the catalog.
- `PressDetails` is exported from the core root as the canonical gesture
  type; `ButtonPressDetails` and `ToggleChangeDetails` remain as aliases.
