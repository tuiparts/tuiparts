# Dialog Preview Recipe

The root registry exposes `core/dialog`, `react/dialog`, and `solid/dialog`.
Each item copies an editable composition into `components/ui/dialog.*`; it does
not replace the foundation Dialog primitive exported by `@tuiparts/core`,
`@tuiparts/react`, and `@tuiparts/solid`.

The recipe owns the terminal-wide black backdrop, responsive centered popup,
border, padding, colors, and the default treatment of each public part. React
and Solid expose the shadcn-style `Dialog`, `DialogTrigger`, `DialogContent`,
`DialogTitle`, `DialogDescription`, and `DialogClose` composition. Each wrapper
retains the matching primitive props and Renderable ref.

## Ownership and interaction

The packaged primitive owns trigger/open state, controlled and uncontrolled
coordination, Escape and topmost-backdrop arbitration, focus containment and
restoration, nesting/stacking, and close event details. Recipes only compose
the public Root, Trigger, Portal, Backdrop, Popup, Title, Description, and
Close parts. Do not recreate these behaviors in copied recipe code.

`open` makes state controlled: `onOpenChange` receives one intent and the
owner must provide the next `open` value. `defaultOpen` is uncontrolled. Escape
and backdrop interaction target only the topmost eligible layer; a popup click
does not dismiss it. Nested dialogs receive a higher layer and closing one
restores focus to its parent or original trigger.

`DialogContent` wraps the primitive Portal, Backdrop, and Popup. Its props are
the primitive Popup props, so callers can set `initialFocus`, dimensions, and
native OpenTUI presentation without replacing the layer behavior. A
`DialogClose` with `reason="action"` reports an accepted action dismissal.

This recipe is validated preview catalog evidence rather than part of the
six-family starter catalog. The adopted `@tuiparts/dialog` manager, provider,
and async APIs stay separate and unchanged.

The `tsconfig.*.json` fixtures compile copied recipes against each supported
surface. `pnpm validate:registry` builds and installs every registry item in
clean consumers, compares exact source and dependencies, type-checks them, and
runs their runtime smokes.
