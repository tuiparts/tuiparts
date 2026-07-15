---
status: accepted
---

# Keep companion reconciliation outside the foundation RC

The foundation RC covers `@tuiparts/core`, `@tuiparts/react`,
`@tuiparts/solid`, and the consumer-owned registry catalog. The already
adopted `@tuiparts/dialog` and `@tuiparts/toast` packages remain supported,
independently versioned companion products, but reconciling their internals is
deferred and does not block the foundation RC. This keeps an unproven companion
migration from being rushed into an otherwise ready pre-release foundation.
