---
status: accepted
---

# Keep companion reconciliation outside the foundation RC

The foundation RC covers `@opentui-ui/core`, `@opentui-ui/react`,
`@opentui-ui/solid`, and the consumer-owned registry catalog. The already
adopted `@opentui-ui/dialog` and `@opentui-ui/toast` packages remain supported,
independently versioned companion products, but reconciling their internals is
deferred and does not block the foundation RC. This keeps an unproven companion
migration from being rushed into an otherwise ready pre-release foundation.
