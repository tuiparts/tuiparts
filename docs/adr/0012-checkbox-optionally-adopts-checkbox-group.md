---
status: accepted
---

# Let Checkbox optionally adopt CheckboxGroup ownership

## Context

Checkbox is a complete two-state control on its own. CheckboxGroup adds shared
array-valued ownership and rendered-order focus navigation to the same control.
This matches Toggle's optional ToggleGroup adoption and differs from Radio,
whose selection meaning is incomplete without RadioGroup.

Checkbox and Switch previously shared the complete internal `CheckedStore`
implementation under ADR-0008. Group adoption gives Checkbox additional value
identity, registration, availability, roving-focus, and callback-detail
semantics that Switch does not have. Keeping the former inheritance would
force CheckboxGroup policy into Switch's state owner or introduce a shallow
translation layer.

## Decision

Existing `Checkbox.Root` optionally adopts CheckboxGroup ownership. A
standalone Checkbox owns controlled or uncontrolled checked state. A grouped
Checkbox requires a unique string `value`; CheckboxGroup owns a readonly array
of checked values. There is no `CheckboxGroup.Item` Part.

Grouped Checkbox activation invokes its local checked-change callback before
the group value-change callback. The same frozen Pressable details object is
reported to both callbacks. Arrow keys and Home/End move roving focus without
changing checked state. Group orientation determines the arrow axis and
navigation wraps unless `loopFocus` is false.

React creates the Checkbox Store before host construction with the optional
group Store from context. Solid constructs the same Core ownership directly.
Framework consumers never pass Stores.

Checkbox now owns its Store implementation following Toggle's proven optional
adoption shape. ADR-0008 remains authoritative for Switch and records the
historical shared checked-state extraction, but its claim that Checkbox and
Switch have identical state behavior is superseded by this decision. Shared
Pressable behavior remains the common activation seam.

## Consequences

- Checkbox remains independently useful and keeps its Root/Indicator anatomy.
- CheckboxGroup does not introduce an artificial Item Part or second checkbox
  identity.
- Grouped initial state is authoritative before framework children render.
- `Checkbox.Root.State` gains truthful `tabbable` state and checked callbacks
  gain Pressable change details.
- Checkbox and Switch no longer share `CheckedStore`; this intentional
  pre-release break avoids leaking collection policy into Switch.
- CheckboxGroup reuses the established internal roving-collection engine, not a
  new universal collection abstraction.
