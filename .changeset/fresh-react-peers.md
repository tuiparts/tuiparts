---
"@tuiparts/react": patch
---

Stop declaring `ws` as a tui.parts peer. Applications install the React
adapter and its OpenTUI/React peers without duplicating an upstream runtime
concern in this package or registry recipes.
