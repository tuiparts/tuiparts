---
status: accepted
---

# Collapse Checkbox and Switch onto one internal CheckedStore

Checkbox and Switch expose distinct public Stores, but their state behavior is
identical. Their facades duplicated every operation while their Root
Renderables duplicated the same Store plumbing.

## Context

`CheckboxStore` and `SwitchStore` were one-line delegation facades over an
internal `CheckedStore`, including duplicate state and options types. The two
Roots also repeated adoption, prop application, activation, accessors, and
replacement guards. This was a deletion test: removing either facade should
not remove behavior that belongs to the checked-state model.

## Decision

`CheckedStore` is the single internal implementation and carries a phantom
string brand. `CheckboxStore extends CheckedStore<"checkbox">` and
`SwitchStore extends CheckedStore<"switch">` remain empty public subclasses;
their state and options names are aliases. The brand preserves the nominal
separation that the old private facade fields provided, so a Checkbox Store
cannot be passed where a Switch Store is expected.

A new internal `CheckedRootRenderable` owns shared checked Root plumbing:
Store construction and adoption, explicit prop application, Pressable
attachment, state access, subscriptions, checked/disabled callbacks, and the
exact per-primitive replacement errors. Checkbox and Switch Roots only supply
their Store type, label, and constructor.

Public module exports and adapter construction remain unchanged. The internal
`CheckedStore` is not exported from the core root index. Parts stay in their
primitive modules because Indicator and Thumb have different rendering
behavior.

## Alternatives considered

- Keep the facades: rejected because they preserve pure delegation and type
  duplication with no independent policy.
- Use type-only aliases with a const-cast constructor: rejected because it
  obscures the declaration output and weakens nominal identity at the public
  Store boundary.
- Merge Checkbox and Switch into one public primitive: rejected. They are
  distinct Catalog products with different public parts (Indicator versus
  Thumb), even though their checked-state behavior is shared.

## Consequences

- Checked-state fixes and tests have one owner, while Checkbox and Switch keep
  their existing public names, constructors, and module seams.
- The branded subclasses retain compile-time separation between the two
  Stores without runtime fields.
- Root plumbing changes land once and future checked Roots can reuse the
  internal base.
- The core package has an internal file dependency that is intentionally not a
  public export; framework adapters continue to construct the unchanged public
  subclasses.
