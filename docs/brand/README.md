# tui.parts Brand System

Working brand reference for tui.parts — the primitive and recipe ecosystem
for OpenTUI. Derived from the 2026-07-15 brand handoff. Where this document
and the handoff disagree, this document wins: it carries the amendments
(registry URL shape, mascot name, typeface).

## The name

- The brand is written `tui.parts` — always lowercase, always with the dot.
  The domain is the wordmark.
- The npm scope and handle form is `@tuiparts`.
- Pronunciation is documented once, in the root README, and never again.
- The descriptor accompanies the brand wherever honesty matters:
  "The primitive and recipe ecosystem for OpenTUI."
- Tagline: "Parts for terminal interfaces. Some assembly encouraged."
- Attribution is mandatory: tui.parts is an independent project and is not
  affiliated with, or endorsed by, the OpenTUI project.

## Voice

Parts-catalog deadpan. Spec-sheet framing over marketing prose:

```
BEHAVIOR: packaged.
STYLE:    yours.
```

Rules:

- Vocabulary is canonical: Primitive, Part, Recipe, Adapter, Catalog,
  Registry, Foundation, Companion package, Renderer, Figure, Kit. Never call
  a packaged Primitive a "component" in brand copy.
- Catalog is the user-facing word; Registry is the serving layer and URL
  vocabulary. Do not mix the two registers in one sentence.
- No emojis in any brand asset.
- Jokes are rationed: deadpan, at most one per surface, never explained.
- Kit never speaks marketing copy; every Kit appearance is a captioned
  Figure (see `kit.md`).

## Concept

A 1970s-80s technical manual / parts catalog (DEC-documentation era):
numbered figures, exploded views, dotted leaders, part callouts, spec-sheet
tables. Every brand asset doubles as truthful documentation of the actual
architecture. If it cannot render in a terminal, it is decoration — never
acceptable for the logomark or a Figure.

## Color

Single accent. Amber phosphor on graphite. Full values in `tokens.json`
(source of truth) and `tokens.css` (web custom properties).

| Token | Hex | Use |
| --- | --- | --- |
| `bg.base` | `#0D1117` | Page and terminal background |
| `bg.surface` | `#161B22` | Cards, code blocks; doubles as ANSI 0 |
| `border` | `#30363D` | Rules, table lines, figure frames on the web |
| `fg.base` | `#E8E4D9` | Body text (warm off-white); doubles as ANSI 7 |
| `fg.muted` | `#A8A296` | Captions, secondary text |
| `fg.faint` | `#6C675D` | Disabled, decorative only (fails body contrast) |
| `amber.base` | `#FFB000` | The accent; doubles as ANSI 3 |
| `amber.dim` | `#CC8C00` | Hover/pressed amber |
| `amber.on` | `#0D1117` | Text on amber fills |

Amber rules:

- At most one amber element per lockup and at most one amber Part per
  Figure. Amber is a phosphor, not a paint bucket.
- Deliberately avoided hues: green phosphor (hacker cliche), pink/pastel
  (Charm owns it), rust orange (Ratatui adjacency).

### ANSI system palette

Structured accents use the ANSI 16-color palette. In terminal contexts,
brand assets emit ANSI indexes so user themes hold; the hex ramp below is
the web rendition of those indexes.

| Index | Name | Hex | Index | Name | Hex |
| --- | --- | --- | --- | --- | --- |
| 0 | black | `#161B22` | 8 | bright black | `#565E68` |
| 1 | red | `#E5484D` | 9 | bright red | `#FF7B72` |
| 2 | green | `#46A758` | 10 | bright green | `#6FCF73` |
| 3 | yellow | `#FFB000` | 11 | bright yellow | `#FFC94D` |
| 4 | blue | `#4C8FD6` | 12 | bright blue | `#7FB5F0` |
| 5 | magenta | `#B083D9` | 13 | bright magenta | `#D2A8FF` |
| 6 | cyan | `#4CC2CE` | 14 | bright cyan | `#7CE0EC` |
| 7 | white | `#E8E4D9` | 15 | bright white | `#FBF8F0` |

Adapter badges alias ANSI slots: **core = white (7)**, **react = cyan (6)**,
**solid = blue (4)**.

## Part numbers

A Catalog entry's part number is its real Registry URL under the amended
serving shape `/r/{adapter}/{recipe}.json`:

```
PART NO. r/react/checkbox.json
```

The Catalog manifest is served at `/r/registry.json`; consumers register the
namespace once: `@tuiparts = https://tui.parts/r/{name}.json`.

## Applications

- **Social/launch card**: 1200x630, `bg.base` background, one Figure as the
  hero (left or center), wordmark plus descriptor lower-left, part number as
  the footer line. The Figure must be a real text render (terminal
  screenshot or HTML styled with `tokens.css`), never redrawn vector art.
- **Docs and site figures**: follow `figures.md` exactly.
- **Motion (site)**: sparing — cursor blink, typewriter reveals, a scanline
  sweep on hover. Nothing that could not plausibly happen in a terminal.

## Files

| File | Contents |
| --- | --- |
| `figures.md` | Figure style guide: grid, whitelist, leaders, captions |
| `logomark.md` | Logomark, wordmark, lockups, misuse |
| `kit.md` | Kit mascot sheet: canonical rendition, poses, rules |
| `typography.md` | Typeface spec, licensing, verified glyph coverage |
| `tokens.json` | Design tokens (source of truth) |
| `tokens.css` | Web custom properties generated from the tokens |
