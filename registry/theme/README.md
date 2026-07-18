# Theme Recipe

These files are the consumer-owned theming layer every other recipe reads
from: a semantic token contract, a small subscription store, and a default
theme built from ANSI-indexed colors so apps inherit the terminal user's own
palette.

- `theme.ts` is the single shared source: it exports the `Tokens` contract,
  `createThemeStore`, the `tint` blend helper, and the app-wide `theme` store.
  It is installed for every framework as `components/ui/theme.ts`.
- `react.tsx` is the installed React `use-theme` binding: a `useTheme()` hook
  over the same store, installed alongside it as
  `components/ui/use-theme.tsx`.
- `solid.tsx` is the installed Solid `use-theme` binding: a reactive
  `useTheme()` accessor over the same store, installed alongside it as
  `components/ui/use-theme.tsx`.

There is no packaged theme runtime. Customization is editing the installed
files: change the default tokens, extend the `Tokens` interface with app-specific
tokens, register preset themes from the catalog (`themes/<name>.ts`) in the
`themes` map, or load user-supplied themes at runtime with `theme.register`.
`theme.follow(renderer)` keeps `mode: "system"` in sync with the terminal's
light/dark signal.
