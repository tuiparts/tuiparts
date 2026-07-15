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

## Theme — Cobalt (dual mode)

Cool engineered near-white light mode, cool graphite dark mode, exactly one
electric cobalt signal accent. The terminal demo pane is **fixed graphite in
both modes** — terminals are dark; the product render never flips.

Light:

- `--blume-background` oklch(0.985 0.004 250)
- `--blume-foreground` oklch(0.24 0.02 258)
- `--blume-muted` oklch(0.958 0.006 250)
- `--blume-muted-foreground` oklch(0.45 0.018 257)
- `--blume-border` oklch(0.895 0.01 255)
- `--blume-accent` oklch(0.52 0.19 257)
- `--blume-code-background` oklch(0.972 0.005 250)

Dark:

- `--blume-background` oklch(0.155 0.012 260)
- `--blume-foreground` oklch(0.93 0.008 250)
- `--blume-muted` oklch(0.195 0.014 260)
- `--blume-muted-foreground` oklch(0.7 0.015 255)
- `--blume-border` oklch(0.3 0.02 258 / 0.75)
- `--blume-accent` oklch(0.7 0.145 253)
- `--blume-code-background` oklch(0.185 0.014 260)

Graphite instrument pane (mode-invariant):

- `--ou-graphite` oklch(0.21 0.016 260) · `--ou-graphite-2` oklch(0.245 0.016 260)
- `--ou-graphite-rule` oklch(0.33 0.02 258)
- `--ou-graphite-ink` oklch(0.93 0.008 250) · `--ou-graphite-muted` oklch(0.66 0.015 255)
- `--ou-graphite-faint` oklch(0.48 0.018 258)
- `--ou-signal` oklch(0.72 0.15 252) — the cobalt signal on graphite

## Typography

- Display: Space Grotesk 500–600, roman only, tracking -0.02em
- Body: Inter 400/500
- Mono: JetBrains Mono — code, eyebrows, meta, kbd hints; UPPERCASE labels at
  0.12–0.14em tracking
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

- Primary: solid cobalt fill, `rounded-blume` (0.5rem), px-5 py-2.5,
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

- The wordmark, the cobalt accent (< 5% of any viewport), the three fonts,
  the CTA voice, mono UPPERCASE eyebrow rhythm, hairline section language.

## What pages MAY differ on

- Landing composes custom sections; docs pages stay inside Blume's layout.

## Exports

### tokens.css

See `apps/www/theme.css` — it is the canonical token file for this project
(Blume injects it last, highest priority).
