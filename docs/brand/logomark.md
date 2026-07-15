# Logomark and Wordmark

## Logomark: the exploded checkbox

One icon that literally depicts the architecture: a Primitive exposing
composable Parts. Canonical rendition:

```
        2 ─╌╌╌ ✓

        1 ─╌╌ ┌─┐
              └─┘

  FIG. 1 — CHECKBOX, EXPLODED VIEW
  1. Root   2. Indicator
```

Construction (column-exact, per `figures.md`):

- Callout digits share a column; leader runs differ (`─╌╌╌` vs `─╌╌`) so
  both end one cell short of their Part.
- The `✓` sits in the same column as the Root's center cell — the
  Indicator hovers exactly where it will land.
- In docs contexts the caption stays. In brand contexts the caption line
  may be replaced by the wordmark (see lockups).

### Compact mark

For favicons, avatars, and any context under six rows:

```
 ✓
┌─┐
└─┘
```

Still exploded — the `✓` never sits inside the box. The assembled checkbox
is a checkbox; the exploded checkbox is the brand.

## Wordmark

`tuiparts.sh` set in Commit Mono, lowercase, with the dot. The domain is the
wordmark.

Dot treatments:

1. Default: the dot matches the text color. Plain text always uses `.`.
2. Accent: the dot carries amber (`#FFB000`). Counts as the lockup's one
   amber element.
3. Display only (web/social): the dot rendered as an amber-filled cell — a
   block cursor parked on the dot. Never in plain text or npm/GitHub copy.

## Lockups

Primary (vertical, brand contexts) — the wordmark takes the caption slot:

```
        2 ─╌╌╌ ✓

        1 ─╌╌ ┌─┐
              └─┘

  tuiparts.sh
```

Wordmark with descriptor (anywhere honesty matters):

```
tuiparts.sh
The primitive and recipe ecosystem for OpenTUI.
```

Launch line (single-line contexts):

```
tuiparts.sh — Parts for terminal interfaces. Some assembly encouraged.
```

## Clearspace and minimums

- Clearspace: at least one empty cell on all sides; two recommended. In
  web layouts, one `ch`/`lh` of the set size.
- The logomark keeps the monospace cell grid at any scale — integer cell
  ratios only, no optical squeezing.
- Web minimums: 12px font size for the compact mark, 14px for the full
  logomark and wordmark.

## Misuse

- Never redraw with heavy, double, or rounded strokes.
- Never close the checkbox: the `✓` does not go inside the box.
- Never put Kit in the logomark.
- Never use more than one amber element per lockup; never use green
  phosphor, pink/pastel, or rust orange.
- No gradients, shadows, 3D, outlines, or italics.
- Never re-set the wordmark in a proportional face, title case, or without
  the dot.
