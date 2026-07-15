---
"@tuiparts/core": patch
"@tuiparts/react": patch
"@tuiparts/solid": patch
---

Keep framework Store wiring private, make Checkbox and Switch inert after
destruction, type every Dialog part ref to its Core Renderable, and construct
React Dialog portals only after commit. Strengthen packed executable and
registry RC compatibility validation.
