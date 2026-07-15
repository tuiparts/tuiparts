# Kit — Mascot Sheet

Kit is the tui.parts mascot: an assembly robot built entirely from
box-drawing characters. The mascot is literally made of parts, which is the
product thesis in creature form. A "kit" is a set of parts you assemble
yourself.

## Placement (binding)

Kit lives in docs, error states, empty states, loading states, and social.
**Never in the logomark.** Kit appears only inside Figures, never as
freestanding decoration, and every appearance is captioned `FIG. 0 — ...`
(`FIG. 0` is reserved for Kit; see `figures.md`).

## Canonical rendition

```
   ┌───┐
   │▪ ▪│
   └─┬─┘
  ┌──┴──┐
╌╌┤  ▞  ├╌╌
  └┬───┬┘
   ┴   ┴

  FIG. 0 — KIT, ASSEMBLED
```

11 columns by 7 rows, grid-exact. This rendition supersedes the handoff
sketch, which had cell-grid drift. Anatomy:

- Head: 5-wide box; neck `┬` meets the chassis `┴` in the same column.
- Indicator eyes: two `▪` cells. The only element that may glow amber.
- Chassis: 7-wide box with the `▞` emblem (Kit-only glyph).
- Arms: `╌╌` dotted leaders — Kit's arms are literally leader lines.
- Feet: two `┴`, column-aligned under the hip `┬` posts.

## Exploded view (the about-page hero)

```
    1 ─╌╌╌ ┌───┐
           │▪ ▪│ ╌╌─ 2
           └─┬─┘

    3 ─╌╌ ┌──┴──┐
        ╌╌┤  ▞  ├╌╌ ╌╌─ 4
          └┬───┬┘

    5 ─╌╌╌ ┴   ┴

  FIG. 0 — KIT, EXPLODED VIEW
  1. Head   2. Indicator eyes   3. Chassis
  4. Arms   5. Feet
```

## Poses

### 404 / missing Recipe

```
   ┌───┐
   │▪ ▪│
   └─┬─┘
  ┌──┴──┐
╌╌┤  ▞  ├╌╌ ✓
  └┬───┬┘
   ┴   ┴

  FIG. 0 — PART NOT FOUND. CHECK THE CATALOG.
```

Kit holds an unmatched part. The expression does not change. Kit has no
expression.

### Empty state

```
   ┌───┐
   │▪ ▪│
   └─┬─┘
  ┌──┴──┐     │       │
╌╌┤  ▞  ├╌╌   │       │
  └┬───┬┘     └───────┘
   ┴   ┴

  FIG. 0 — BIN, EMPTY
```

### Loading (terminal-spinner compatible)

Kit assembles itself one part per frame. All frames are 11x7, padded with
spaces, so they swap in place. The Indicator comes online last.

```
    F1            F2            F3            F4            F5

                                             ┌───┐         ┌───┐
                                             │   │         │▪ ▪│
                                             └─┬─┘         └─┬─┘
                ┌─────┐       ┌─────┐       ┌──┴──┐       ┌──┴──┐
                │  ▞  │     ╌╌┤  ▞  ├╌╌   ╌╌┤  ▞  ├╌╌   ╌╌┤  ▞  ├╌╌
                └┬───┬┘       └┬───┬┘       └┬───┬┘       └┬───┬┘
   ┴   ┴         ┴   ┴         ┴   ┴         ┴   ┴         ┴   ┴

  FIG. 0 — KIT, ASSEMBLING (FRAMES F1-F5)
```

### Assembly callout (docs)

```
   ┌───┐
   │▪ ▪│
   └─┬─┘
  ┌──┴──┐
╌╌┤  ▞  ├╌╌ ─┐
  └┬───┬┘
   ┴   ┴

  FIG. 0 — ASSEMBLY, ENCOURAGED
```

Kit holds an Allen key. IKEA-manual deadpan.

### Launch / social

```
   ┌───┐      ┌─────────────┐ ╌╌─ 1
   │▪ ▪│      │ CONFIRM?    │
   └─┬─┘      ├─────────────┤
  ┌──┴──┐     │ [Y]     [N] │ ╌╌─ 2
╌╌┤  ▞  ├╌╌ ╌╌└─────────────┘
  └┬───┬┘
   ┴   ┴

  FIG. 0 — DIALOG, ASSEMBLY IN PROGRESS
  1. Title   2. Actions
```

Kit assembles a dialog from labeled parts. Before shipping a production
asset, verify callout labels against the shipped Dialog contract: if a
region is a real Part, the real Part name is mandatory.

## Rules (binding)

- Kit is drawn BY the diagram system, not on top of it: same character
  whitelist, same single light line weight as every Figure.
- Amber accent only, and only the `▪` eyes may glow `#FFB000`.
- No gradients, no 3D, no kawaii proportions, no mouth — ever.
  Differentiation from pastel-cute is a hard requirement.
- Kit never speaks marketing copy; captions stay in spec-sheet voice.
- Every appearance is a captioned Figure numbered `FIG. 0`.
- Do not invent new limbs, sizes, or props without updating this sheet.
