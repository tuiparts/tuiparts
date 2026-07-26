---
status: accepted
---

# Let NumberField coordinate native Input editing and terminal scrubbing

## Context

NumberField owns a numeric value but must also preserve incomplete text while a
user edits. The existing Input Primitive deliberately leaves editing state to
OpenTUI; wrapping it would not provide the shared numeric draft, bounds,
stepping, commit, and Part coordination NumberField requires. Reimplementing a
text editor would discard mature OpenTUI cursor, selection, paste, undo, and
single-line behavior.

Base UI also exposes browser pointer-lock scrubbing. OpenTUI instead provides
absolute terminal-cell coordinates, primary-button drag events, captured drag
routing, and deterministic mock-mouse tests. Its Slider and text-selection
implementations prove this coordinate model without proving a generic drag
abstraction for tuiparts.

## Decision

NumberField Core owns numeric value, draft text, normalization, bounds,
stepping, callbacks, and commit policy in one Store. Its Input Part directly
extends OpenTUI's Input Renderable and coordinates the native edit buffer with
that Store. NumberField narrows insertion and paste to its plain ASCII numeric
draft grammar; it does not adopt Base UI's browser locale-formatting surface.
It does not compose the standalone tuiparts Input Primitive or add a
framework-owned state machine.

NumberField exposes Root, Input, Increment, Decrement, and ScrubArea. Grouping
is Recipe-owned. ScrubArea derives horizontal step requests from the difference
between the current absolute X coordinate and the press origin. OpenTUI owns
drag capture. An accepted start clears OpenTUI text selection so selectable
presentation children do not interfere with dragging. There is no
ScrubAreaCursor, pointer lock, teleportation, pixel sensitivity, touch contract,
or mouse-wheel stepping.

The numeric implementation remains NumberField-private. Slider may motivate a
shared numeric or drag seam only after both shipped contracts prove identical
rules.

## Consequences

- NumberField retains OpenTUI editing quality while packaging numeric behavior.
- Draft text may differ from committed numeric value without violating
  controlled ownership.
- Scrubbing is terminal-cell based, selection-free, deterministic, and testable
  through the public OpenTUI mouse seam.
- Recipes can place labels or other presentation inside ScrubArea without a
  packaged visual Group.
- NumberField does not make browser form, locale, cursor, or touch concepts part
  of the Foundation interface.
