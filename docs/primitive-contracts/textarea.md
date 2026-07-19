# Textarea Primitive Contract

## Status

This is the intended public contract for the Textarea vertical. It applies the
shared [Primitive Contract](../../PRIMITIVE_CONTRACT.md) and
[ADR-0009](../adr/0009-deliver-primitives-and-recipes-as-complete-verticals.md)
to OpenTUI's multiline editing control.

## Boundary and ownership

OpenTUI is the behavior and state owner. Its `TextareaRenderable`,
`EditBuffer`, `EditorView`, cursor, selection, undo history, scrolling,
keybindings, paste handling, and native callback order remain authoritative.
tuiparts adds only consistent disabled gating and framework adaptation. It does
not mirror text in a Store, add controlled rollback, or create a second value
owner.

Textarea is a named single-part Primitive:

- Core exports `TextareaRenderable` and `TextareaOptions`.
- React and Solid export `Textarea` with `Textarea.Props`.
- There is no artificial `Root`, no compound Part, and no Store because the
  native Renderable is already the honest ownership and composition boundary.
- The Primitive chooses no colors, dimensions, placeholder content, glyphs,
  or visual assembly. Installed Recipes own visual defaults.

## Native state, events, actions, and refs

- `initialValue` retains OpenTUI's initialize-once semantics. Later text
  changes use native `setText`, `replaceText`, `insertText`, `clear`, and edit
  operations directly; there is no `value` or `defaultValue` facade.
- `onContentChange`, `onCursorChange`, and `onSubmit` retain OpenTUI's event
  payloads, meanings, and order. Core forwards them once. React strips
  constructor registration so the reconciler is the sole framework event
  owner and does not duplicate callbacks. Solid updates the same native
  callback properties on its retained Renderable.
- `submit()` is the semantic imperative submission action. Native editing,
  cursor, selection, undo/redo, highlighting, and text methods remain available
  on the Renderable without wrapper handles.
- React and Solid refs resolve to the actual Core `TextareaRenderable`.
  Reactive prop changes retain that Renderable and its native `EditBuffer`.
- No part is conditional and there is no `keepMounted` policy.

## Interaction and lifecycle

- OpenTUI owns multiline keybindings. Return inserts a newline; the native
  submit binding (Meta+Return by default) invokes `submit()`. Key aliases and
  consumer keybinding overrides retain their native behavior.
- Native pointer selection, scrolling, paste, cursor movement, and editing are
  preserved while enabled.
- `disabled` gates focus, keyboard handling, paste, pointer drag selection,
  wheel scrolling, and `submit()` at every public interaction seam. Disabling
  a focused Textarea blurs it, marks the editor suspended, and removes it from
  focus traversal. Re-enabling restores focusability without changing text,
  cursor, selection, scroll position, or history.
- Programmatic text and editing methods remain native operations while
  disabled. Disabled is an interaction gate, not a second state owner or a
  read-only buffer mode.
- Mount, removal, and destruction use OpenTUI lifecycle directly. The adapters
  add no listeners or ownership object requiring separate teardown.
- “Unavailable” has no consumer prop. A detached, hidden, or destroyed
  Textarea follows OpenTUI Renderable availability and lifecycle behavior.

## Conformance evidence

| Surface | Evidence or N/A reason |
| --- | --- |
| Core | Public test-renderer coverage owns initialization, native content/cursor/submit order, newline versus submit keys, native programmatic editing, paste, initially and dynamically disabled focus/edit/paste/submit/pointer-selection/wheel-scroll gating, re-enable behavior, and teardown. |
| React | Real `testRender` coverage proves initial props, callback routing once, callback replacement/removal, retained Renderable and EditBuffer identity, actual ref lifecycle, StrictMode mounting, disabled updates, and one native interaction round-trip. Store, controlled-frame, state snapshot, context-error, and subscription rows are N/A because Textarea has no Store, controlled state, state callback, required context, or adapter subscription. |
| Solid | Real rendering coverage proves reactive props, callback replacement/removal, retained Renderable and EditBuffer identity, actual ref target, disabled updates, cleanup, and one native interaction round-trip. Store, controlled-frame, state snapshot, context-error, and subscription rows are N/A for the same ownership reasons. |
| Registry | Core, React, and Solid installed-consumer smokes prove mount, one native edit/submit round-trip, Recipe-owned visual defaults, and theme restyling through public properties. |
| Packed | The three `textarea` package subpaths are included in packed declaration and runtime import validation with strict peer installation. |
| Terminal | N/A: OpenTUI's real test renderer drives the complete focus, multiline key, paste, and submission sequence through the public Renderable; tuiparts adds no renderer-global or platform-only coordination that requires a separate PTY claim. |

Controlled/uncontrolled ownership, readonly snapshots, semantic change details,
compound registration, conditional Parts, and keyboard activation are N/A.
Textarea deliberately preserves OpenTUI-native state, events, editing actions,
and enabled pointer behavior instead of inventing those surfaces.
