---
status: accepted
---

# Release the foundation as stable linked packages

The `@tuiparts` scope has no published foundation versions, so Core, React,
and Solid use `0.0.0` as their unpublished baseline and release together at
`0.0.1` through the ordinary Changesets workflow. Subsequent foundation
releases remain linked and stable; an RC phase would add version history
without validating a release that users can install. Dialog and Toast remain
independently versioned companion products and do not join the foundation
release plan.
