---
status: accepted
---

# Let Toggle optionally adopt ToggleGroup ownership

## Context

Toggle is a complete two-state control on its own. ToggleGroup adds shared
single- or multiple-selection and roving focus to the same control. This
differs from Radio, whose selection meaning is incomplete without a
RadioGroup.

Base UI exposes `Toggle` and `ToggleGroup` as separate single-part components:
a Toggle rendered inside a group contributes its explicit `value`; the same
Toggle rendered outside a group owns `pressed` and `defaultPressed` itself.

## Decision

React and Solid export direct `Toggle` and `ToggleGroup` components. Neither
uses an artificial `Root` or `Item` namespace.

A standalone Toggle owns controlled or uncontrolled pressed state. A grouped
Toggle requires a unique string `value`; ToggleGroup owns the readonly array
of pressed values and may permit one or multiple pressed Toggles. The Toggle's
`onPressedChange` runs for its activation request, followed by the group's
`onValueChange` request.

Arrow keys and Home/End move roving focus without changing pressed state.
Enter, Return, Space, primary pointer release, and `press()` activate the
focused Toggle. Group orientation determines which arrow axis is handled.
Navigation wraps at the collection edges by default; the Base UI-aligned
`loopFocus` prop disables wrapping so arrows stop at the first and last
Toggles.

React creates the Toggle Store before host construction. The Store can read
authoritative group selection immediately, then mounting attaches collection
membership and focus coordination to that same Store. Solid constructs the
Core Renderable directly. Framework consumers never pass Stores.

## Consequences

- The package API matches the Base UI composition model.
- Toggle remains useful independently; ToggleGroup does not create a second
  kind of item component.
- Grouped initial state has no bridge, handoff, or post-mount correction.
- Group values are arrays in both single and multiple mode; single mode may be
  empty when its pressed Toggle is activated again.
- Recipes may export the familiar `ToggleGroupItem` convenience name while it
  remains presentation over the same packaged Toggle primitive.
