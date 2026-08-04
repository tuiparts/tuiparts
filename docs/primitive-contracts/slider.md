# Slider Primitive contract

## Product boundary

Slider is a packaged Primitive because bounded numeric ownership, stepped
keyboard actions, terminal-cell pointer dragging, focus, commit timing, and
cross-runtime lifecycle would otherwise be repeated by applications. Core owns
that behavior. Recipes own dimensions, labels, glyphs, colors, layout, and
value formatting.

OpenTUI's native `SliderRenderable` supplies private pointer hit testing,
capture, track mapping, and Thumb-relative drag offsets inside `Slider.Track`.
It does not own the public value or presentation contract.

## Public shape and ownership

- `Root` is non-focusable and owns or adopts one `SliderStore`.
- `Track` is the one focusable interaction Part. It coordinates native pointer
  mechanics with the Store and accepts arbitrary visual children.
- `Range` is an optional passive Part that exposes Root state to presentation.
- `Thumb` is an optional passive Part that exposes Root state to presentation.
- The first contract supports one scalar value, one Track, one Range, and one
  Thumb. Multiple Thumbs are outside this vertical.

Value ownership is controlled or uncontrolled `number`. `defaultValue`
initializes uncontrolled state; otherwise the value starts at `min`. Bounds are
finite and inclusive, defaulting to `0` and `100`. `step` and `largeStep` are
positive finite values defaulting to `1` and `10`. External values are clamped
but remain otherwise authoritative. Pointer requests snap to the nearest step
anchored at `min`, while keyboard actions add decimal-safe steps from the
observed value and clamp to bounds.

Root state is a frozen stable snapshot containing `value`, `min`, `max`,
`step`, `largeStep`, `orientation`, `disabled`, `readOnly`, `focused`, and
`dragging`.

`onValueChange` reports one accepted semantic request. `onValueCommit` reports
one accepted value-changing keyboard action, bound action, track press, or
moved drag. Details identify the `keyboard` or `pointer` source and the claimed
key or pointer reason without retaining OpenTUI events.

## Interaction and lifecycle

Horizontal Track handles Left and Right. Vertical Track handles Down and Up.
Page Down and Page Up use `largeStep` in either orientation. Home and End claim
the finite bounds. Cancelled keys and modifier chords are ignored. Keyboard
focus belongs to Track.

A primary-button Track press focuses Track, clears terminal text selection,
and requests the snapped value represented by the pointer cell. Captured drag
updates through the same Store and commits its final requested value once on
release. Native continuous callbacks are deduplicated at the semantic Store
seam. Controlled mode reports intent while retaining the externally supplied
value; the hidden pointer engine may retain transient gesture position and
resynchronizes when the interaction ends.

Disabled Track rejects focus and interaction-driven mutation. Read-only Track
may focus but rejects interaction-driven mutation. External controlled values
continue to update either state. Non-primary and prevented pointer gestures
are ignored. Removing Root permanently ends all
same-Store descendant coordination and active pointer work.

Native Slider `value`, `min`, `max`, `viewPortSize`, colors, orientation, and
`onChange` are reserved private coordination properties on Track and are not
public Track options.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | Store and Renderable tests own controlled/uncontrolled state, finite configuration, decimal steps, orientation keys, bounds, callback order/details, focus, native track press and captured drag, controlled drag, pointer gating, transparent painting, Part composition, lifecycle, and teardown. |
| React | Real renderer tests own authoritative first render, controlled prop removal, callback replacement, owner-feedback dragging, orphan errors, refs, retained Track and Store identity, Strict Mode, conditional Parts, and one interaction round trip. |
| Solid | The adapter matrix repeats through signals, controlled owner-feedback dragging, reactive prop removal, retained Renderables, and cleanup. |
| Registry | Core, React, and Solid Recipes compile and run in isolated consumers, change one value, render Recipe-owned Track/Range/Thumb presentation, and react to Theme changes. |
| Packed | All `/slider` subpaths receive declaration, runtime-import, and representative packed-consumer checks. |
| Terminal | Runnable Core, React, and Solid tracers demonstrate focus, keyboard stepping, track presses, and dragging. |

Collections, overlays, unavailable selection, conditional visibility, and
public Root state hooks are N/A. All Parts follow ordinary explicit mount and
unmount lifecycle, and Recipes receive Root state directly through Root
children.
