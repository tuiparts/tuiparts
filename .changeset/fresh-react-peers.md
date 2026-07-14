---
"@opentui-ui/react": patch
---

Stop declaring `ws` as an OpenTUI UI peer. Applications install the React
adapter and its OpenTUI/React peers without duplicating an upstream runtime
concern in this package or registry recipes.
