# Typography

## Typeface

**Primary: Commit Mono** (v1.143 or later) — SIL Open Font License 1.1,
verified 2026-07-15. Anonymous, neutral, designed for code. Author's
guidance: weight 400 on dark backgrounds, 450 on light.

**Secondary/fallback: IBM Plex Mono** — OFL 1.1, verified 2026-07-15.
Used only when Commit Mono cannot load.

Rejected: Berkeley Mono (commercial license incompatible with OSS/web
distribution), Geist Mono (Vercel brand adjacency), pixel faces (the medium
is text cells, not pixels). See the rebrand decision log.

## Web stack

```css
font-family:
  "Commit Mono", "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas,
  monospace;
```

Self-host WOFF2 (OFL permits embedding); do not rename the font (OFL name
retention). Body 400; 700 for headings, sparingly. No italics in Figures.

## The single-face rule for Figures

A Figure must render entirely from one font face. Per-glyph fallback mixes
line weights and breaks the grid visually. Consequences:

- The figure whitelist (`figures.md`) may only contain glyphs covered by
  Commit Mono.
- If a WOFF2 subset is served, the subset must include U+2500-259F and the
  state glyphs, or Figures will silently fall back. Verify after
  subsetting.

## Verified glyph coverage

Method: parsed the `cmap` table of `CommitMono-400-Regular.otf` from the
v1.143 release (2026-07-15). Results:

| Range | Coverage |
| --- | --- |
| Box Drawing U+2500-257F | 127/128 (missing only U+252D `┭`) |
| Block Elements U+2580-259F | 32/32 |
| State and cell glyphs `✓ ✗ ▪ ▞` | All present |

The one missing glyph, U+252D, is a mixed-weight tee — banned from the
figure system anyway (single light line weight). Every whitelisted glyph is
covered. Re-run the check when bumping the font version.

## Captions

Figure captions are set in all caps with letterspacing on the web
(`letter-spacing: 0.05em`). Commit Mono has no true small caps; do not
synthesize them (`font-variant-caps` synthesis mixes weights). In plain
text, caps alone carry the style: `FIG. 1 — CHECKBOX, EXPLODED VIEW`.
