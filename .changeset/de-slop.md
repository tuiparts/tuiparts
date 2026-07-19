---
"@tuiparts/core": minor
"@tuiparts/react": minor
"@tuiparts/solid": minor
---

De-slop pass across the foundation surface:

- Stores expose state through the `state` getter only; the duplicate
  `getState()` methods on ButtonStore, ToggleStore, and the shared
  checked-state implementation are removed (Renderables keep `getState()` —
  that is the adapter seam).
- Dialog Title and Description no longer take or hold a `store`; the field
  was write-only.
- The core root barrel now exports all seven primitive Stores and their
  options types.
- Listener notification uses one re-entrancy posture everywhere: iterate a
  copy, skip listeners that unsubscribed mid-notification.
