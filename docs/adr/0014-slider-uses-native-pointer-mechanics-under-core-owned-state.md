---
status: accepted
---

# Use native Slider pointer mechanics under Core-owned state

## Context

OpenTUI Core exposes `SliderRenderable` with horizontal and vertical pointer
hit testing, direct track presses, captured dragging, and Thumb-relative drag
offsets. Its public control is otherwise scrollbar-oriented and monolithic: it
paints Track and Thumb, sizes Thumb from `viewPortSize`, emits continuous
values, invokes the same callback for imperative setters and pointer input,
and has no focus, keyboard, step, disabled, read-only, controlled, commit,
React, Solid, or compound-Part contract.

A direct tracer confirmed those limits. A second tracer normalized the native
range to `0..100`, made native painting transparent, composed custom Track,
Range, and Thumb nodes, deduplicated semantic callbacks, added focus and
keyboard steps, preserved captured dragging, and synchronized external values
without user callbacks.

Reimplementing the complete native pointer path would duplicate tested
OpenTUI capture and drag-offset behavior. Letting the native class own public
state or presentation would violate the Primitive contract and prevent the
required cross-runtime Parts.

## Decision

Slider Core owns the public numeric value, controlled or uncontrolled
ownership, bounds, steps, orientation, focus reflection, disabled and read-only
policy, semantic callbacks, commit timing, and immutable state in one
`SliderStore`.

`Slider.Track` privately extends OpenTUI's `SliderRenderable`. Its native range
is normalized to `0..100`; native foreground and background painting are
transparent. Native continuous callbacks are translated into domain values and
routed through the Store. Store-to-native synchronization is guarded so
programmatic updates do not become user callbacks. During controlled pointer
work, the hidden native value may remain transient until release so resetting
a controlled value cannot corrupt native drag offset.

Track is the focusable keyboard and pointer Part. Range and Thumb are passive
public Box Parts that consume the same Store. Recipes own all visible content,
including Track, Range, and Thumb glyphs and geometry. Native `value`, bounds,
viewport size, colors, orientation, and callback options are reserved and
omitted from Track's public options.

Track gates `processMouseEvent` before native handlers run. It accepts only an
uncancelled primary-button interaction when enabled and mutable, clears text
selection, starts Store pointer coordination, and finishes one commit on
release. Disabled and read-only changes cancel Store pointer work and prevent
later native callbacks from becoming semantic requests.

This is a component-specific adaptation, not a generic drag or range
abstraction. NumberField keeps its absolute-cell ScrubArea implementation.
Shared numeric or pointer machinery is extracted only if the shipped contracts
later prove identical rules.

## Consequences

- Slider reuses OpenTUI's mature capture and drag-offset mechanics without
  exposing its scrollbar-oriented public API.
- Core remains the sole public behavior owner, and React and Solid adapt the
  same Store and Renderables.
- Recipes can compose and reference real Track, Range, and Thumb Parts while
  native painting stays invisible.
- Native callback multiplicity is an internal concern; one physical request
  produces at most one semantic callback for each distinct stepped value and
  one commit.
- Explicit Core tests become compatibility alarms for OpenTUI hit testing,
  capture, callback timing, transparent painting, and child-event bubbling.
- If pointer gating, controlled dragging, or upstream compatibility cannot be
  maintained through public Renderable seams, Track will replace native
  mechanics with private terminal-cell dragging without changing the public
  Slider contract.

## Rejected alternatives

### Expose native Slider directly

Rejected for the Foundation because it lacks the required behavior and Parts.
Direct OpenTUI use remains appropriate for a continuous monolithic control.

### Wrap native Slider as the public state owner

Rejected because setter callbacks, continuous values, viewport Thumb sizing,
and absent keyboard and ownership policy would leak into every adapter.

### Reimplement pointer dragging immediately

Rejected while native mechanics can be retained behind a tested private seam.
The fallback remains available if hardening tests expose unstable coupling.

### Extract shared numeric or drag infrastructure first

Rejected because NumberField ScrubArea and Slider Track have different gesture,
step-grid, focus, and commit contracts.
