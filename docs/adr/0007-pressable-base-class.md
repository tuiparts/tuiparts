---
status: accepted
---

# Concentrate activation behavior in one internal Pressable base class

Every press-activated Root — Checkbox, Switch, Button, Toggle, Radio, and the
Dialog Trigger and Close parts — subclasses the internal
`PressableRenderable` (`core/src/internal/pressable.ts`). The base owns the
gesture contract; subclasses own what one semantic press means.

## Context

Five core Roots independently re-implemented the same ~70–80 lines of
activation plumbing: mouse-up activation, Space/Enter key handling,
disabled-driven focusability and blur, focus mirroring into the Store, Store
adoption, and teardown. The copies drifted. Four different keyboard guard
sets shipped at once: Checkbox and Switch checked neither `defaultPrevented`
nor modifiers (Ctrl+Space toggled a checkbox), Button skipped modifiers,
Radio skipped `defaultPrevented`, and Dialog Trigger/Close checked nothing.
Two pointer models coexisted: Button required a press to start and end on the
node; everything else activated on any primary release over the node.

The codebase already had the proven fix at an adjacent seam:
`RovingCollectionStore` is an internal base class with protected hooks that
both group Stores subclass.

## Decision

### One shared interaction contract

- Keyboard activation is an uncancelled, unmodified Space or Enter press.
  Cancelled keys and modifier chords are never consumed.
- Pointer activation requires an uncancelled primary-button press that starts
  and ends on the node. Releasing elsewhere, dragging off, or cancelling
  either half abandons the gesture. This adopts Button's model everywhere.

### One internal base class

`PressableRenderable extends BoxRenderable` owns mouse handling (via
`onMouseEvent`), the activation key map (via `handleKeyPress`), disabled
focusability sync, focus mirroring, the public imperative `press()`, and
source teardown. Subclasses supply:

- `handlePress(details)` — required; the meaning of one semantic press.
- `handleUnclaimedKey(key)` — optional; keys beyond the activation map, such
  as roving-focus navigation (Toggle, Radio).
- `pressableDisabled()` / `pressableFocusable()` — optional; state shapes
  that diverge from a plain Store (Radio's collection item state, Toggle's
  roving tab stop).
- `onPointerPressedChanged(pressed)` — optional; visual pressed state
  (Button).

### A minimal Store interface, satisfied structurally

The base consumes a `PressableStore` — `state.disabled`, `subscribe()`,
optional `setFocused()` — attached by the subclass constructor through
`attachPressable(store)` after its Store exists. Every foundation Store
satisfies the interface structurally, so Roots attach their Store directly
with no adapter object. Radio keeps its custom collection subscription and
only overrides the hooks; Dialog Trigger/Close attach nothing and stay
permanently enabled. A future Store with a diverging state shape can attach
an inline adapter literal at the same seam.

### One press-details vocabulary

`PressDetails` (`{source: "imperative"}` | `{key, source: "keyboard"}` |
`{button: 0, source: "pointer"}`) is the single gesture vocabulary, exported
from the core root. `ButtonPressDetails` and `ToggleChangeDetails` are
aliases of it. `RadioGroupChangeDetails.source` renamed `"programmatic"` to
`"imperative"` to match; this pre-release break landed before the first
published foundation version.

### Testing

The activation matrix — guards, pointer model, disabled sync, focus
mirroring, source lifecycle — is proven once at the internal seam in
`core/src/internal/pressable.test.ts` through a minimal fake subclass. Each
Root's suite keeps one pointer and one keyboard wiring round-trip plus its
genuinely unique behavior, and does not re-prove the matrix.

## Consequences

- Guard and pointer fixes land once and apply to every press-activated Root.
- New press-activated primitives implement `handlePress` and adapt a source;
  they do not copy plumbing.
- The interaction rules in `FOUNDATION_PRIMITIVE_CONTRACT.md` now state the
  shared guard and pointer model; per-primitive drift from them is a
  conformance failure, not a documented idiosyncrasy.
- Behavior changes shipped with this decision: modifier chords and cancelled
  keys no longer activate any Root; pointer activation now requires the
  press to start on the node; Dialog Trigger/Close honor both rules.
