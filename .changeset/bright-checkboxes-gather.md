---
"@tuiparts/core": patch
"@tuiparts/react": patch
"@tuiparts/solid": patch
---

Add CheckboxGroup with array-valued checked ownership, optional Checkbox.Root adoption, effective disablement, dynamic registration, and orientation-aware roving focus.

Checkbox state now exposes `tabbable`, and checked-change callbacks receive immutable terminal press details. Checkbox no longer shares its internal Store implementation with Switch so grouped collection policy remains isolated from Switch.
