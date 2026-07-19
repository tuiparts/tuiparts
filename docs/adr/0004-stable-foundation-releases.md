---
status: accepted
---

# Release the foundation as stable linked packages

At the time of this decision, the `@tuiparts` scope had no published
Foundation versions. Core, React, and Solid therefore used `0.0.0` as their
unpublished baseline and released together at `0.0.1` through the ordinary
Changesets workflow.

Foundation releases remain linked and stable. Dialog and Toast remain
independently versioned companion products and do not join the Foundation
release plan. `scripts/validate-foundation-release.mjs` enforces both rules.
