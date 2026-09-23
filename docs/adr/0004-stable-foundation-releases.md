---
status: accepted
---

# Release the foundation as stable linked packages

At the time of this decision, the `@tuiparts` scope had no published
Foundation versions. Core, React, and Solid therefore used `0.0.0` as their
unpublished baseline and released together at `0.0.1` through the ordinary
Changesets workflow.

Foundation releases remain linked and stable. The established
`@opentui-ui/dialog` and `@opentui-ui/toast` packages remain independently
versioned companion products under their existing package names. They do not
join a Foundation release plan, but may be maintained and released separately.
Their implementations may later adopt Foundation Primitives without changing
the companions' public package identities or APIs.

`scripts/validate-foundation-release.mjs` enforces the separation between
Foundation and companion release plans.
