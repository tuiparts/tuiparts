---
"@tuiparts/core": patch
"@tuiparts/react": patch
"@tuiparts/solid": patch
---

Renamed the npm scope from `@opentui-ui` to `@tuiparts`. The project is now
tui.parts — the primitive and recipe ecosystem for OpenTUI. Package behavior
and APIs are unchanged; only the name moved. The final `@opentui-ui/*`
releases are deprecated with pointers to their `@tuiparts/*` successors.

The dialog, toast, and utils packages are deferred from the foundation RC
cycle per release policy and receive their scope-rename release together,
after this cycle ships (dialog and toast depend on utils).
