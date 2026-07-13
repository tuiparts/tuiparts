---
"@opentui-ui/core": patch
"@opentui-ui/react": patch
"@opentui-ui/solid": patch
---

Harden the canonical `Checkbox.Root` and `Checkbox.Indicator` contract across
Core, React, and Solid, including clean `CheckboxProps` and `CheckboxState`
types, primary-pointer cancellation, Store composition, retained refs, and
retained Indicator lifecycle.
