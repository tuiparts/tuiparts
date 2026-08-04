# Native Slider viability prototype

- **Date:** 2026-07-30
- **OpenTUI version:** `@opentui/core@0.4.3`
- **Question:** Where, if anywhere, can `SliderRenderable` fit inside the planned tuiparts.sh Slider vertical?

## Run

Direct native tracer:

```bash
pnpm --filter @tuiparts/core prototype:native-slider
```

Adapted pointer-engine tracer:

```bash
pnpm --filter @tuiparts/core prototype:native-slider-adapter
```

The throwaway tracers are:

- `packages/core/examples/native-slider-prototype.ts`
- `packages/core/examples/native-slider-adapter-prototype.ts`

## Iteration 1: direct native control

The first tracer uses `SliderRenderable` without adding behavior or custom
rendering.

### Observations

- Native track presses and captured dragging work.
- A single track click produced two `onChange` callbacks in the PTY trace.
- Clicking a 32-cell slider bounded from `-1` to `1` resolved to
  `0.441860...`, which was not aligned to a proposed `0.25` step.
- Right Arrow, Home, and End did not change the value. `SliderRenderable` has no
  native focus or keyboard contract.
- Assigning `slider.value = 0` invoked the same `onChange` callback used for
  pointer changes. Prop synchronization cannot be distinguished from a user
  request without another owner.
- `viewPortSize=0.2` and `viewPortSize=0.01` produced the same large Thumb for a
  `-1` to `1` range. Rendering applies an effective minimum viewport size of
  one value unit, consistent with scrollbar-oriented Thumb sizing.
- The native Renderable paints Track and Thumb itself. Track, Range, and Thumb
  are not public nodes that Recipes can compose or reference.
- The supported React and Solid packages do not expose a corresponding native
  slider element.

### Direct-adoption verdict

The native control is viable directly when an application wants a continuous,
pointer-driven, monolithic scrollbar-style slider. It is not a sufficient
public Foundation contract by itself.

## Iteration 2: private normalized pointer engine

The second tracer subclasses `SliderRenderable` only to retain its mouse
capture, direct track press, and drag-offset calculations. It normalizes the
native range to `0..100`, makes native painting transparent, and adds custom
Track, Range, and Thumb children. The adapter owns domain bounds, `0.25`
stepping, semantic callback deduplication, focus, keyboard actions, and external
value synchronization.

### Observed interaction

- A track click moved `-0.5` to the snapped value `0.5` and emitted one semantic
  pointer change despite multiple native callbacks.
- Right Arrow after the click moved `0.5` to `0.75` and emitted one keyboard
  change.
- A captured drag moved `0.75` to `-0.5` and retained the custom visual Parts.
- Applying external value `-0.75` synchronized the hidden native value to
  `12.5` without emitting a semantic user change.
- Transparent native painting allowed custom Track, Range, and Thumb children
  to render over the same hit area.
- Setting the generic `onMouse` listener can focus the adapted control without
  replacing native mouse handling. Reading and wrapping `onMouseDown` does not
  work because OpenTUI exposes a setter rather than a readable handler.

### What the native class contributes

- Track hit testing
- Direct pointer-to-value mapping
- Captured drag delivery
- Thumb-relative drag offset
- Horizontal and vertical coordinate policy

### What tuiparts.sh must still own

- Controlled and uncontrolled domain value
- Bounds, decimal-safe normal steps, and large steps
- Keyboard actions and focus policy
- Disabled and read-only gating
- Semantic change and commit details
- Core, React, and Solid lifecycle
- Public Track, Range, and Thumb Parts
- Native callback suppression and value synchronization
- Recipe-owned dimensions, glyphs, and colors

## Revised verdict

`SliderRenderable` is **not viable as the authoritative Slider Store or public
visual contract**, but it **is viable as the private pointer engine of
`Slider.Track`**.

That reuse is meaningful: it avoids recreating mouse capture and Thumb-relative
drag calculations while allowing the Foundation Store and public Parts to stay
independent. The normalized `0..100` internal range also avoids coupling native
viewport sizing to consumer bounds.

The adapted approach is not yet production proof. Before accepting it, a
focused implementation spike must verify:

1. Disabled and read-only children can prevent every native pointer path.
2. Dynamic width, bounds, step, and orientation updates preserve mapping.
3. One physical press or drag produces one semantic change sequence and one
   commit.
4. Track, Range, and Thumb mount, unmount, and reorder without losing pointer
   coverage.
5. React and Solid retain the same Core Track instance across prop updates.
6. Native upstream changes cannot bypass the Store or expose transparent
   painting artifacts.

## Recommendation

Proceed with the Slider specification using a tuiparts Store as the sole domain
owner and `SliderRenderable` as an implementation candidate for the private
pointer mechanics of `Slider.Track`.

Do not expose native `value`, `viewPortSize`, foreground color, background
color, or `onChange` as the Foundation contract. Do not treat the native class
as evidence that Slider can skip Core, adapter, lifecycle, or interaction
tests.

If the production spike cannot prove pointer gating and callback arbitration,
fall back to a private terminal-cell drag implementation. Direct native use
remains preferable for applications that do not need the deeper Foundation
contract.
