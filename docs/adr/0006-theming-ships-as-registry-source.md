---
status: accepted
---

# Theming ships as Registry source

## Context

Recipes previously hard-coded every color, glyph, and density value as
literals in each installed file. Consumers wanting a coherent visual identity
had to hand-edit every recipe and keep the values consistent by discipline
alone; the catalog had no way to ship ready-made themes, and apps could not
respect the terminal user's palette or light/dark preference even though
OpenTUI reports both (`renderer.themeMode`, the `theme_mode` event, indexed
colors via `RGBA.fromIndex`).

The Foundation Primitive Contract already assigns presentation to recipes:
primitives must not choose colors, glyphs, or themes. Any theming design
therefore had to live on the recipe side of that boundary.

## Decision

The entire theming system is consumer-owned Registry source. There is no
`@tuiparts/*/theme` package export and no contract amendment.

- The `theme` catalog item installs one file (`components/ui/theme.ts`)
  containing the semantic token contract (`Tokens`), a small subscription
  store with eager resolution
  (`base ⊕ active.tokens ⊕ active[mode] ⊕ override` into a frozen snapshot,
  referentially stable until the next change — the contract's existing State
  idiom), platform mode-following (`theme.follow(renderer)` over the
  `theme_mode` event with `mode: "system" | "dark" | "light"`), runtime
  registration (`theme.register`), and the `tint` blend helper. The React and
  Solid items add a `useTheme` binding over the same store, installed as a
  separate small file beside the shared store source
  (`components/ui/use-theme.tsx`).
- The default theme uses ANSI-indexed colors and a default-intent background,
  so installed recipes inherit the terminal user's palette and transparency.
- Preset themes (`theme-<name>`) are framework-neutral `DeepPartial<Tokens>`
  files installed to `themes/<name>.ts`. They import the consumer's own
  `ThemeDefinition` type, so everything a preset specifies is type-checked by
  the consumer's compiler, missing keys fall back to the consumer's base, and
  consumer token extensions never break a preset install.
- Every recipe item declares its adapter's theme item in
  `registryDependencies`, so installing any recipe guarantees the theme file
  exists; recipes read tokens instead of literals and derive interaction
  states from few tokens plus structural affordances rather than per-intent
  ramps.

Rejected alternatives: a packaged core theme primitive with a
`createThemeContext` factory (a pub-sub plus deep-merge is not difficult
behavior — "package the difficult behavior, copy the opinionated layer");
AsyncLocalStorage (construction-time capture is useless for retained
renderable trees); full-`Tokens` preset implementations (break under consumer
token extensions); per-intent state-ramp token matrices (weld the contract to
one interaction-state model and make presets large); a runtime JSON theme
format with reference resolution (our presets are compile-time TypeScript,
so named constants and the compiler already provide references and validation).

Deferred, recorded to avoid re-derivation: a palette-derived system theme
generator over `renderer.getPalette` (synthesizes surface/border/muted ramps
ANSI-16 has no slots for) and luminance-based mode fallback for terminals
that never answer the theme-mode query.

## Consequences

- The Foundation Primitive Contract is untouched; that the design required
  zero contract changes is evidence it sits at the right layer.
- Customization is editing an owned file, not configuring a hidden runtime;
  adding a ThemeProvider, subtree scoping, persistence, or theme-file
  discovery later is a consumer-side edit, and `theme.register` is the seam
  runtime theme loading builds on.
- The theme item is a Recipe in catalog vocabulary: it packages no behavior.
- Registry validation treats theme and preset items like every other catalog
  item: isolated strict consumers, byte-identical install checks, and runtime
  smokes through public renderable properties.
- A versioned theme-contract package is reconsidered only when a second,
  independent registry demonstrates genuine reuse of the contract — the same
  extraction rule the contract applies to shared infrastructure.
