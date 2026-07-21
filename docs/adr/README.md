# Architecture decisions

Accepted ADRs are binding context for changes to public interfaces, state
ownership, package seams, framework adaptation, shared behavior, Registry
ownership, and release policy.

## Start here

Agents creating or changing a Primitive or Recipe must begin with
[ADR-0009](0009-deliver-primitives-and-recipes-as-complete-verticals.md). It
defines the required implementation surfaces, test ownership, documentation,
Registry work, package exports, validation, and release evidence.

`PRIMITIVE_CONTRACT.md` remains the normative behavior and conformance
specification. ADR-0009 defines how to deliver that contract completely.

## Accepted decisions

| ADR | Decision |
| --- | --- |
| [0001](0001-react-primitive-store-adaptation.md) | React creates the authoritative Core Store before host construction; framework consumers never wire Stores. |
| [0002](0002-radio-requires-radio-group.md) | Radio always belongs to RadioGroup. |
| [0004](0004-stable-foundation-releases.md) | Core, React, and Solid ship as stable linked Foundation packages; companions remain independent. |
| [0005](0005-toggle-optionally-adopts-toggle-group.md) | Toggle may own standalone state or adopt ToggleGroup ownership. |
| [0006](0006-theming-ships-as-registry-source.md) | Theming is consumer-owned Registry source, not a packaged Primitive. |
| [0007](0007-pressable-base-class.md) | Press-activated Roots share one internal gesture implementation and contract. |
| [0008](0008-checked-store-collapse.md) | Checkbox and Switch share one internal checked-state implementation while retaining distinct public Stores. |
| [0009](0009-deliver-primitives-and-recipes-as-complete-verticals.md) | Every Primitive or Recipe ships as a complete, validated vertical with tests owned by the correct seam. |
| [0010](0010-public-root-state-hooks.md) | Framework adapters expose public Root state through `useRootState()` hooks; Recipes read Primitive state from them instead of Recipe-local contexts. |

ADR numbering is intentionally append-only and may contain gaps. ADR-0003 was
a temporary RC decision superseded by ADR-0004 before the first stable
Foundation release; the obsolete record was removed during the 2026-07-19 ADR
audit.
