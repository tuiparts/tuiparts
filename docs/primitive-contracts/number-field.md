# NumberField Primitive contract

## Product boundary

NumberField is a packaged Primitive because numeric draft parsing, nullable value
ownership, bounds, decimal stepping, commit timing, press controls, terminal
scrubbing, and lifecycle coordination would otherwise be repeated by
applications. Core owns that behavior. Recipes own labels, glyphs, grouping,
dimensions, spacing, colors, and variants.

## Public shape and ownership

- `Root` is non-focusable and owns or adopts one `NumberFieldStore`.
- `Input` is the one focusable OpenTUI editor coordinated by the Store.
- `Increment` and `Decrement` are Pressable Parts using the same step engine.
- `ScrubArea` is a non-focusable pointer-drag Part with arbitrary children.
- Grouping layout is Recipe-owned. Browser pointer cursors have no terminal
  Part.

Value ownership is controlled or uncontrolled `number | null`. Draft input text
is distinct from committed numeric value so incomplete decimal text remains
editable. The terminal grammar accepts ASCII digits, at most one decimal point,
and at most one leading plus or minus sign. It rejects every nonnumeric edit and
paste atomically before changing the visible draft. Empty input requests null.
Complete finite in-range decimal text may request a value while editing. Enter
or blur clamps and normalizes complete text, commits null for empty text, and
reverts valid but incomplete text.

Root state is a frozen stable snapshot containing `value`, `inputValue`,
`disabled`, `readOnly`, `focused`, and `scrubbing`. Normal, small, and large
steps default to 1, 0.1, and 10. Numeric configuration is finite, steps are
positive, and minimum cannot exceed maximum.

`onValueChange` reports accepted requests after uncontrolled state commits;
controlled mode reports intent. `onValueCommit` reports Enter/blur commits,
keyboard steps, Increment/Decrement activation, and one moved scrub release.
Details use terminal reasons and never retain browser or OpenTUI event objects.

## Interaction and lifecycle

Up/Down use the normal step. Alt+Up/Down use the small step. Shift+Up/Down and
Page Up/Page Down use the large step. Home and End claim finite minimum and
maximum bounds. Step arithmetic avoids visible decimal floating-point artifacts
and clamps to bounds.

ScrubArea records the primary-button down X coordinate and observed value. Each
drag derives `initialValue + horizontalCellDelta * step`, making results
independent of event frequency. OpenTUI drag capture continues delivery outside
the Part. Starting an accepted scrub clears OpenTUI text selection so arbitrary
ScrubArea label children cannot become selected during the drag. A moved drag
commits once on release; a click does not change or commit. Non-primary,
disabled, and read-only gestures are ignored.

Root disablement blocks focus and every mutation seam. Read-only state preserves
Input focus but blocks editing and value changes. Increment and Decrement become
effectively disabled at their respective bounds. Removing Root permanently ends
all same-Store descendant coordination. Part registration and teardown are
single-owner, terminal, and idempotent.

## Conformance evidence plan

| Surface | Applicability and evidence |
| --- | --- |
| Core | Store and Renderable tests own parsing, draft/commit behavior, ownership, bounds, precision, all step modes, Part disablement, callback details/order, focus, scrub dragging/capture, lifecycle, and teardown. |
| React | Real renderer tests own authoritative first render, controlled prop removal, callback replacement, context, refs, retained identity, Strict Mode, and one interaction round trip. |
| Solid | The adapter matrix repeats through signals, reactive prop removal, retained Renderables, and cleanup. |
| Registry | Core, React, and Solid Recipes compile and run in isolated consumers, change one value, render Recipe-owned presentation, and react to Theme changes. |
| Packed | All `/number-field` subpaths receive declaration, runtime-import, and representative packed-consumer checks. |
| Terminal | Runnable Core, React, and Solid tracers demonstrate editing, stepping, press controls, and ScrubArea dragging. |

Conditional Parts, collection coordination, overlays, unavailable selection,
and public Root state hooks are N/A. All Parts are explicitly composed and
remain mounted according to ordinary framework lifecycle.
