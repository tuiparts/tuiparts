# Design — tui.parts docs site

A locked design system for `apps/www`. Every page redesign reads this file
before emitting code. Do not regenerate per page — extend or amend this file
when the system needs to grow.

## Genre

modern-minimal (dev-tool register)

## Macrostructure family

- Marketing pages (landing): **Dev-tool / CLI** — asymmetric hero (title left,
  live terminal demo right), trade statement, primitives split, one dark
  graphite band (registry + catalog), hairline pillar row, closing CTA.
- Content pages (docs): Blume's built-in docs layout. Typography and token
  theming only — no enrichment, no custom sections.

## Theme — tui.parts amber/graphite (dual mode)

Brand-exact graphite dark mode, warm paper light mode derived from the same
palette, exactly one amber signal accent. Palette source of truth:
`docs/brand/tokens.json`. The terminal demo pane is **fixed brand graphite
in both modes** — terminals are dark; the product render never flips.

Light (warm paper — derived, since the brand defines one dark scheme):

- `--blume-background` #fbf8f0 (brand ansi-15 cream)
- `--blume-foreground` #161b22 (dark-mode surface doubles as light-mode ink)
- `--blume-muted` #f2ecdf
- `--blume-muted-foreground` #6c675d (brand fg-faint; 5.3:1 on cream)
- `--blume-border` #e4ddca
- `--blume-accent` #8f6400 — deepened amber; #ffb000 is a dark-ground
  signal and fails text contrast on cream (AA-checked, 4.9:1)
- `--blume-code-background` #f4efe2

Dark (brand-exact from `docs/brand/tokens.json`):

- `--blume-background` #0d1117
- `--blume-foreground` #e8e4d9
- `--blume-muted` #161b22
- `--blume-muted-foreground` #a8a296
- `--blume-border` #30363d
- `--blume-accent` #ffb000 · `--blume-accent-foreground` #0d1117
- `--blume-code-background` #161b22

Graphite instrument pane (mode-invariant, maps 1:1 onto brand tokens):

- `--tp-graphite` #0d1117 · `--tp-graphite-2` #161b22
- `--tp-graphite-rule` #30363d
- `--tp-graphite-ink` #e8e4d9 · `--tp-graphite-muted` #a8a296
- `--tp-graphite-faint` #6c675d
- `--tp-signal` #ffb000 — the amber signal on graphite ·
  `--tp-signal-ink` #0d1117

## Typography

- One face for every role: **Commit Mono** (self-hosted WOFF2, OFL 1.1,
  `public/fonts/`), fallback IBM Plex Mono — the brand's single-face rule
  (`docs/brand/typography.md`). Static instances 400/700 ship; weight
  requests between snap to the nearer instance.
- Display: Commit Mono 600–700, roman only
- Body: Commit Mono 400
- Mono roles as before — code, eyebrows, meta, kbd hints; UPPERCASE labels
  at 0.12–0.14em tracking
- Never subset below U+2500-259F: Figures must render from one face or
  box-drawing glyphs silently fall back mid-figure
- Headings use `text-wrap: balance`; ledes use `text-wrap: pretty`
- No italic headings, ever. Emphasis via weight or the accent.

## Spacing

Tailwind 4-pt scale. Landing sections breathe at py-20/py-24; hairlines
(`--blume-border`) divide sections, not boxed cards.

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (strong ease-out) for entrances;
  `cubic-bezier(0.2, 0, 0, 1)` for icon cross-fades
- Reveal: fade + 10px rise, 500ms, stagger ≤ 50ms, IntersectionObserver,
  plays once
- Hero: one type-in of the demo command (steps), then static; one blinking
  input caret persists (authentic terminal behavior)
- Press: `scale(0.97)`, 150ms, on every button-shaped element
- Reduced motion: everything visible and static; the input caret still blinks
  is NOT allowed — all animation gates behind
  `prefers-reduced-motion: no-preference`
- Never `transition: all`. Transform/opacity/filter only for animation.

## Microinteractions stance

- Copy buttons: clipboard + check cross-fade (opacity 0→1, scale 0.25→1,
  blur 4px→0), silent revert after 2s, `aria-live="polite"` announcement
- Hover states gated behind hover-capable devices (Tailwind v4 default)
- No celebratory toasts, no parallax, no autoplay loops beyond the caret

## CTA voice

- Primary: solid amber fill (`--blume-accent`), `rounded-blume` (0.5rem), px-5 py-2.5,
  named destination ("Read the docs", "Quickstart")
- Secondary: 1px `--blume-border` outline, hover border shifts to accent
- Tertiary: accent text link with `→`, arrow nudges 2px on hover

## Per-page allowances

- Landing MAY use the graphite instrument pane and hand-built TUI demo
  (Tier-A CSS art — it renders the actual product, no fake browser chrome,
  no traffic-light dots).
- Docs pages: typography only.
- No invented metrics anywhere. No stock imagery. No gradient text. No
  glassmorphism. No background textures.

## What pages MUST share

- The wordmark, the amber accent (< 5% of any viewport — one amber element
  per lockup), the single Commit Mono face, the CTA voice, mono UPPERCASE
  eyebrow rhythm, hairline section language.

## What pages MAY differ on

- Landing composes custom sections; docs pages stay inside Blume's layout.

## Exports

### tokens.css

See `apps/www/theme.css` — it is the canonical token file for this project
(Blume injects it last, highest priority).
