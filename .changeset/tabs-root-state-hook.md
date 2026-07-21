---
"@tuiparts/react": patch
"@tuiparts/solid": patch
---

Add the public `Tabs.useRootState()` hook exposing the frozen public Root
state snapshot to composition-aware parts. The Registry Tabs Recipe now reads
List orientation from it instead of a recipe-local context, so Recipe layout
can no longer desynchronize from keyboard orientation under primitive
composition.
