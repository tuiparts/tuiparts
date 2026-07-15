# Figure Style Guide

Rules for producing `FIG. N` box-drawing schematics. A Figure is any
captioned box-drawing diagram, including every Kit appearance. Figures are
the signature graphic system of tui.parts: exploded views of real
Primitives, labeled with real Part names.

## The hard requirement

Every Figure must be copy-pasteable into a terminal and survive as plain
text. If a Figure needs color, a web font, or pixel alignment to make
sense, it is not a Figure.

## Grid

- Every glyph occupies exactly one terminal cell. No wide characters, no
  emojis, no combining marks.
- Hard maximum width: 72 columns. Keep Figures as narrow as truth allows.
- Alignment is column-exact. Connection glyphs must line up across rows
  (a `┬` above must meet a `┴` below in the same column).
- Verify by pasting the Figure into a terminal at 80 columns.

## Character whitelist

| Role | Glyphs | Codepoints |
| --- | --- | --- |
| Structure | `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼` | U+2500, U+2502, U+250C, U+2510, U+2514, U+2518, U+251C, U+2524, U+252C, U+2534, U+253C |
| Leaders | `╌` (horizontal), `╎` (vertical) | U+254C, U+254E |
| State glyphs | `✓ ✗` | U+2713, U+2717 |
| Cells and shading | `▪ █ ▀ ▄ ░ ▒ ▓` | U+25AA, U+2588, U+2580, U+2584, U+2591, U+2592, U+2593 |
| Kit only | `▞` (chassis emblem) | U+259E |

Everything else is prose. All whitelist glyphs are verified present in
Commit Mono v1.143 (see `typography.md`).

**Banned:** heavy strokes (`━ ┃`), double strokes (`═ ║`), rounded corners
(`╭ ╮ ╯ ╰`), mixed-weight tees (`┭` and friends), and any character wider
than one cell. One line weight: light. The diagram system has a single pen.

## Leaders and callouts

Callouts number the Parts of the depicted Primitive. Syntax:

- A leader reads outward from its callout digit: one space after the digit,
  then `─` (the solid anchor), then a run of `╌`, then one space, then the
  Part. Mirrored on the right side: Part, space, `╌` run, `─`, space, digit.
- Leaders never touch the digit or the Part — one space on each side.
- Callout digits on the same side of a Figure share a column. Vary the
  `╌` run length to keep them aligned.
- Vertical leaders use `╎` with the same rules.

```
        2 ─╌╌╌ ✓

        1 ─╌╌ ┌─┐
              └─┘
```

## Captions and numbering

- Caption line: two-space indent, all caps, em dash with spaces:
  `  FIG. N — SUBJECT, VIEW`
- One blank line between the diagram and the caption.
- The Part list follows on the next line(s): entries as `N. Name`,
  separated by three spaces: `  1. Root   2. Indicator`
- Figures number sequentially within a document, starting at `FIG. 1`.
- `FIG. 0` is reserved for Kit. Every Kit appearance is `FIG. 0`,
  regardless of context — Kit is never promoted into the documentation
  sequence.

## Part labels

- When a Figure depicts a Primitive, callouts use the contract Part names
  exactly: Root, Indicator, and so on. Never generic labels ("piece 1").
- When a Figure depicts a Recipe or a composed scene, labels may describe
  regions descriptively — but check the contract first; if a region is a
  real Part, use the real name.

## Exploded views

The signature Figure. Rules:

- Parts drift apart along one axis (usually vertical), separated by blank
  lines, in their assembled order.
- Connection glyphs stay column-aligned across the gap (the neck `┬` sits
  directly above the chassis `┴`), so the assembly is legible.
- Every separated Part gets a callout.

## Color in Figures

- Figures are monochrome foreground on `bg.base` by default.
- At most one Part per Figure may carry amber (`#FFB000` on the web,
  ANSI yellow in terminals) — typically the state glyph or Kit's eyes.
- Never color structure lines.

## Checklist before shipping a Figure

1. Paste into a terminal: grid intact, nothing wraps at 80 columns.
2. Every glyph is on the whitelist.
3. Connection glyphs align column-exact.
4. Caption format and numbering rules hold (`FIG. 0` only if Kit).
5. Part labels match the contract.
6. At most one amber Part.
