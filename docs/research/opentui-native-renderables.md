# OpenTUI native Renderables and tuiparts ownership

Research date: 2026-07-20

## Scope

This audit asks when tuiparts should package a Primitive around an OpenTUI
native Renderable. It uses OpenTUI commit
[`34e78b2fbf18fd969efdf5f3e2589d17d1f536f1`](https://github.com/anomalyco/opentui/commit/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1),
dated 2026-07-18, where the Core, React, and Solid packages are version 0.4.5.
tuiparts currently supports OpenTUI `^0.4.3` through the workspace catalog.

## Conclusion

Do not package pass-through Foundation Primitives merely to rename native
controls, provide style defaults, obtain framework support, or make the
inventory symmetrical. OpenTUI already owns both behavior and framework
Renderable identity for Select, Input, and Textarea.

A native-backed, single-part Primitive is justified only when tuiparts adds a
concrete reusable interaction contract. Textarea's comprehensive disabled
behavior passes this deletion test. A Select alias does not.

Native-backed Recipes are a separate and valid path. They may consume OpenTUI
Core, React, and Solid directly when copied source still owns meaningful
presentation or composition.

## Framework adapters

OpenTUI React registers `input`, `select`, and `textarea` directly to their
Core constructors in its
[component catalogue](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/react/src/components/index.ts#L1-L40).
Its host reconciler creates the Core object, mutates that same object during
updates, and exposes it as the public instance
([creation](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/react/src/reconciler/host-config.ts#L48-L68),
[updates and public instance](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/react/src/reconciler/host-config.ts#L151-L161)).
React also provides typed Select `onChange` and `onSelect` props and actual
`SelectRenderable` refs
([types](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/react/src/types/components.ts#L141-L177),
[event replacement](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/react/src/utils/index.ts#L48-L78)).

OpenTUI Solid provides the equivalent native registrations
([catalogue](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/solid/src/elements/catalogue.ts#L80-L105)),
typed props and Renderable refs
([types](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/solid/src/types/elements.ts#L124-L151)),
and same-object reactive property and listener updates
([reconciler](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/solid/src/reconciler.ts#L191-L207),
[event routing](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/solid/src/reconciler.ts#L260-L326)).

Therefore a tuiparts wrapper is not needed for framework adaptation, reactive
updates, callback replacement, or actual Renderable refs.

## Select

Native `SelectRenderable` already owns:

- options, selected index, scrolling, wrapping, and viewport repair;
- Up/Down and `j`/`k` navigation, fast movement, and Enter activation;
- selection-change and item-selected events;
- imperative movement, selection, and selected-option methods;
- focused and selected rendering.

The behavior and options are implemented in
[`Select.ts`](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/Select.ts#L1-L115),
with public state methods and event emission
[here](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/Select.ts#L230-L317).

Select does not have disabled behavior or pointer item activation. Those gaps
do not by themselves justify a wrapper. A Select Primitive would require an
approved tuiparts contract for focus rejection, dynamic disablement,
keyboard and imperative request gating, and possibly unavailable options or
pointer activation. Merely forwarding native props and callbacks fails the
deletion test.

Select also renders a fixed internal option tree and a hard-coded selection
indicator
([rendering](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/Select.ts#L130-L215)).
A native-backed Recipe may theme exposed colors, spacing, descriptions, and
indicator visibility, but it cannot honestly claim ownership of that internal
glyph or assembly.

## Slider

Native Slider owns min/max clamping, value and viewport-size state, horizontal
and vertical rendering, track clicks, and thumb dragging
([implementation](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/Slider.ts#L1-L205)).
It is not focusable, has no keyboard behavior, and has no disabled pointer
gating. It is also absent from the built-in React and Solid catalogues.

Registration alone should be contributed upstream rather than turned into a
permanent Foundation wrapper. Slider becomes an honest tuiparts Primitive only
if tuiparts owns the missing reusable contract: focus, orientation-aware arrow
keys, Home/End, step semantics, disabled keyboard and pointer gating, semantic
change details, and retained Core identity in both framework adapters.

## Input and Textarea

OpenTUI owns both controls' mutable editing state and native event order.
Neither native control has a disabled option.

The current tuiparts Input Primitive adds the documented narrow contract:
disabled focus rejection, keyboard rejection, submission rejection, dynamic
blur, and focusability updates. The public documentation correctly limits its
claim to those behaviors. This remains package-worthy only while that contract
is intentional; native callbacks and refs are not additional justification.

The tuiparts Textarea Primitive adds substantially deeper behavior: disabled
focus, keyboard, paste, wheel, pointer-selection, selection-update, and submit
gating; dynamic active-drag cancellation while preserving the editor range;
and adapter-safe optional-prop removal. Removing it would force nuanced
interaction and lifecycle policy into every caller, so it passes the deletion
test while OpenTUI remains the editing owner.

OpenTUI's native editing implementation is in
[`Textarea.ts`](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/Textarea.ts#L1-L340)
and
[`EditBufferRenderable.ts`](https://github.com/anomalyco/opentui/blob/34e78b2fbf18fd969efdf5f3e2589d17d1f536f1/packages/core/src/renderables/EditBufferRenderable.ts#L1-L180).

## Direction

1. Keep Textarea as the reference native-backed single-part Primitive.
2. Keep Input only for its explicit tuiparts disabled contract; do not cite
   native callback or ref adaptation as justification.
3. Do not add a Select Foundation Primitive without an approved behavior
   contract that is materially deeper than OpenTUI Select.
4. Evaluate Select, if pursued, as a native-backed Registry Recipe with its
   fixed native presentation limitations stated clearly.
5. Treat Slider as a possible full Primitive vertical, not a registration
   wrapper. Prefer upstreaming basic React and Solid registration first.
6. Re-audit compatibility-only subclass setters when the minimum OpenTUI
   version advances; remove tuiparts code once upstream safely owns it.
