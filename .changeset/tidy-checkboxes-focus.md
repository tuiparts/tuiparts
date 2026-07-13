---
"@opentui-ui/core": patch
"@opentui-ui/react": patch
"@opentui-ui/solid": patch
---

Harden the canonical `Checkbox.Root` and `Checkbox.Indicator` contract across
Core, React, and Solid with an attachable Core `CheckboxStore`, part-scoped
framework types, direct Store ownership for Indicator, automatic React wiring,
primary-pointer cancellation, and retained Indicator lifecycle.
